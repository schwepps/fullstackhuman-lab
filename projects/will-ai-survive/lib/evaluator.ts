import Anthropic from '@anthropic-ai/sdk'
import { nanoid } from 'nanoid'
import { buildEvaluationParams } from './prompt-builder'
import { saveResult, incrementStats } from './result-store'
import {
  SECTION_REGEX,
  parseSection,
  type ParsedSection,
} from './section-schemas'
import { INCOMPLETE_EVALUATION_ERROR, stopReasonError } from './stop-reason'
import type {
  CalendarUnit,
  EvaluationResult,
  TimelineEntry,
  SSEEvent,
} from './types'

const anthropic = new Anthropic()

function parseSectionJson(name: string, json: string): ParsedSection | null {
  try {
    return parseSection(name, JSON.parse(json))
  } catch {
    return null
  }
}

// ── Streaming evaluator ─────────────────────────────────────────

/**
 * Streams an AI evaluation as SSE events.
 *
 * Claude outputs structured text with XML section markers.
 * We accumulate text as it streams, extract completed sections,
 * parse their JSON content, and emit SSE events progressively.
 */
export function createEvaluationStream(
  situation: string
): ReadableStream<SSEEvent> {
  let chaosRating = 0
  let chaosLabel = ''
  let survivalDuration = ''
  let calendarUnit: CalendarUnit | undefined
  const timeline: TimelineEntry[] = []
  let breakingPoint = ''
  let resignationLetter = ''
  let oneLineSummary = ''
  let realTalkInsight = ''
  let closed = false
  let accumulated = ''
  let lastParsedIndex = 0
  let droppedSections = 0

  function safeEnqueue(
    controller: ReadableStreamDefaultController<SSEEvent>,
    event: SSEEvent
  ) {
    if (!closed) controller.enqueue(event)
  }

  function safeClose(controller: ReadableStreamDefaultController<SSEEvent>) {
    if (!closed) {
      closed = true
      controller.close()
    }
  }

  function safeError(
    controller: ReadableStreamDefaultController<SSEEvent>,
    message: string
  ) {
    safeEnqueue(controller, { type: 'error', data: { message } })
    safeClose(controller)
  }

  function extractSections(
    controller: ReadableStreamDefaultController<SSEEvent>
  ) {
    // Search for completed XML sections in accumulated text
    // Start from where we last parsed to avoid re-processing
    const searchText = accumulated.slice(lastParsedIndex)
    const baseOffset = lastParsedIndex
    let match: RegExpExecArray | null

    // Reset regex state for each call
    SECTION_REGEX.lastIndex = 0

    while ((match = SECTION_REGEX.exec(searchText)) !== null) {
      const sectionName = match[1]
      const jsonContent = match[2].trim()

      // Set absolute cursor position (match.index is relative to searchText)
      lastParsedIndex = baseOffset + match.index + match[0].length

      const section = parseSectionJson(sectionName, jsonContent)
      if (section) {
        handleSection(controller, section)
      } else {
        droppedSections++
        console.warn(
          `Skipped invalid ${sectionName} section:`,
          jsonContent.slice(0, 100)
        )
      }
    }
  }

  function handleSection(
    controller: ReadableStreamDefaultController<SSEEvent>,
    section: ParsedSection
  ) {
    switch (section.name) {
      case 'chaos_rating': {
        ;({ chaosRating, chaosLabel, survivalDuration, calendarUnit } =
          section.data)
        safeEnqueue(controller, { type: 'chaos_rating', data: section.data })
        break
      }

      case 'timeline_entry': {
        const entry: TimelineEntry = section.data
        timeline.push(entry)
        safeEnqueue(controller, { type: 'timeline_entry', data: entry })
        break
      }

      case 'breaking_point': {
        breakingPoint = section.data.breakingPoint
        safeEnqueue(controller, { type: 'breaking_point', data: section.data })
        break
      }

      case 'resignation': {
        ;({ resignationLetter, oneLineSummary } = section.data)
        safeEnqueue(controller, { type: 'resignation', data: section.data })
        break
      }

      case 'real_talk': {
        realTalkInsight = section.data.insight
        safeEnqueue(controller, { type: 'real_talk', data: section.data })
        break
      }
    }
  }

  function hasRequiredSections(): boolean {
    return Boolean(
      chaosLabel &&
      survivalDuration &&
      timeline.length > 0 &&
      breakingPoint &&
      resignationLetter
    )
  }

  async function finalizeEvaluation(
    controller: ReadableStreamDefaultController<SSEEvent>,
    stopReason: Anthropic.Beta.BetaStopReason | null
  ) {
    const stopError = stopReasonError(stopReason)
    if (stopError) return safeError(controller, stopError)

    extractSections(controller)
    if (!hasRequiredSections()) {
      return safeError(controller, INCOMPLETE_EVALUATION_ERROR)
    }

    try {
      const id = nanoid(12)
      const result: EvaluationResult = {
        id,
        situation,
        chaosRating,
        chaosLabel,
        survivalDuration,
        calendarUnit,
        timeline,
        breakingPoint,
        resignationLetter,
        oneLineSummary,
        realTalkInsight,
        createdAt: Date.now(),
      }
      await saveResult(result)
      // Best-effort: a failed counter must not hide a saved result
      incrementStats().catch(() => {})
      safeEnqueue(controller, { type: 'complete', data: { id } })
    } catch {
      safeEnqueue(controller, {
        type: 'error',
        data: { message: 'Failed to save result. Please try again.' },
      })
    }
    safeClose(controller)
  }

  function logUsage(message: Anthropic.Beta.BetaMessage) {
    const { usage } = message
    console.info('Evaluation usage:', {
      model: message.model,
      stopReason: message.stop_reason,
      fallbackRan: (usage.iterations ?? []).some(
        (entry) => entry.type === 'fallback_message'
      ),
      inputTokens: usage.input_tokens,
      cacheReadTokens: usage.cache_read_input_tokens,
      cacheWriteTokens: usage.cache_creation_input_tokens,
      outputTokens: usage.output_tokens,
      timelineEntries: timeline.length,
      droppedSections,
    })
  }

  let modelStream: ReturnType<typeof anthropic.beta.messages.stream> | null =
    null

  return new ReadableStream<SSEEvent>({
    // The reader went away: stop paying for output nobody will see
    cancel() {
      closed = true
      modelStream?.abort()
    },
    async start(controller) {
      try {
        const stream = anthropic.beta.messages.stream(
          buildEvaluationParams(situation)
        )
        modelStream = stream
        stream.on('text', (text) => {
          accumulated += text
          extractSections(controller)
        })

        const message = await stream.finalMessage()
        await finalizeEvaluation(controller, message.stop_reason)
        logUsage(message)
      } catch (error) {
        console.error('Evaluation catch:', {
          name: error instanceof Error ? error.name : 'unknown',
          message: error instanceof Error ? error.message : String(error),
          status:
            error instanceof Anthropic.APIError ? error.status : undefined,
        })
        if (!closed) {
          safeError(
            controller,
            error instanceof Anthropic.RateLimitError
              ? 'AI is overwhelmed right now. Try again in a moment.'
              : 'AI evaluation failed. Please try again.'
          )
        }
      }
    },
  })
}
