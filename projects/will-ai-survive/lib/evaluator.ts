import Anthropic from '@anthropic-ai/sdk'
import { nanoid } from 'nanoid'
import { buildEvaluationParams } from './prompt-builder'
import { saveResult, incrementStats } from './result-store'
import type { EvaluationResult, TimelineEntry, SSEEvent } from './types'

const anthropic = new Anthropic()

// ── XML section markers we expect from Claude ───────────────────

const SECTION_REGEX =
  /<(chaos_rating|timeline_entry|breaking_point|resignation|real_talk)>\s*([\s\S]*?)\s*<\/\1>/g

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
  const timeline: TimelineEntry[] = []
  let breakingPoint = ''
  let resignationLetter = ''
  let oneLineSummary = ''
  let realTalkInsight = ''
  let closed = false
  let accumulated = ''
  let lastParsedIndex = 0

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
    let match: RegExpExecArray | null

    // Reset regex state for each call
    SECTION_REGEX.lastIndex = 0

    while ((match = SECTION_REGEX.exec(searchText)) !== null) {
      const sectionName = match[1]
      const jsonContent = match[2].trim()

      // Move parse cursor past this match
      lastParsedIndex += match.index + match[0].length

      try {
        const data = JSON.parse(jsonContent)
        handleSection(controller, sectionName, data)
      } catch {
        // JSON parse failed — skip this section
        console.warn(
          `Failed to parse ${sectionName} JSON:`,
          jsonContent.slice(0, 100)
        )
      }
    }
  }

  function handleSection(
    controller: ReadableStreamDefaultController<SSEEvent>,
    name: string,
    data: Record<string, unknown>
  ) {
    switch (name) {
      case 'chaos_rating': {
        const raw = Number(data.chaosRating) || 5
        chaosRating = Math.min(10, Math.max(1, raw))
        chaosLabel = String(data.chaosLabel || '')
        survivalDuration = String(data.survivalDuration || '')
        const empathyNote = data.empathyNote
          ? String(data.empathyNote)
          : undefined
        safeEnqueue(controller, {
          type: 'chaos_rating',
          data: {
            chaosRating,
            chaosLabel,
            survivalDuration,
            ...(empathyNote && { empathyNote }),
          },
        })
        break
      }

      case 'timeline_entry': {
        const thought = data.thought ? String(data.thought) : undefined
        const emoji = data.emoji ? String(data.emoji) : undefined
        const entry: TimelineEntry = {
          time: String(data.time || ''),
          event: String(data.event || ''),
          sanityLevel: String(data.sanityLevel || ''),
          ...(thought ? { thought } : {}),
          ...(emoji ? { emoji } : {}),
        }
        timeline.push(entry)
        safeEnqueue(controller, { type: 'timeline_entry', data: entry })
        break
      }

      case 'breaking_point': {
        breakingPoint = String(data.breakingPoint || '')
        safeEnqueue(controller, {
          type: 'breaking_point',
          data: { breakingPoint },
        })
        break
      }

      case 'resignation': {
        resignationLetter = String(data.resignationLetter || '')
        oneLineSummary = String(data.oneLineSummary || '')
        safeEnqueue(controller, {
          type: 'resignation',
          data: { resignationLetter, oneLineSummary },
        })
        break
      }

      case 'real_talk': {
        realTalkInsight = String(data.insight || '')
        safeEnqueue(controller, {
          type: 'real_talk',
          data: { insight: realTalkInsight },
        })
        break
      }
    }
  }

  return new ReadableStream<SSEEvent>({
    async start(controller) {
      try {
        const params = buildEvaluationParams(situation)
        const stream = anthropic.messages.stream(params)

        stream.on('text', (text) => {
          accumulated += text
          extractSections(controller)
        })

        stream.on('error', (error) => {
          console.error('Anthropic stream error:', {
            name: error instanceof Error ? error.name : 'unknown',
            message: error instanceof Error ? error.message : String(error),
            status:
              error instanceof Anthropic.APIError ? error.status : undefined,
          })
          safeError(
            controller,
            error instanceof Anthropic.APIError
              ? 'AI evaluation failed. Please try again.'
              : 'Something went wrong. Please try again.'
          )
        })

        stream.on('end', async () => {
          if (closed) return

          // Final extraction pass in case last section completed
          extractSections(controller)

          try {
            const id = nanoid(12)
            const result: EvaluationResult = {
              id,
              situation,
              chaosRating,
              chaosLabel,
              survivalDuration,
              timeline,
              breakingPoint,
              resignationLetter,
              oneLineSummary,
              realTalkInsight,
              createdAt: Date.now(),
              upvotes: 0,
            }

            await saveResult(result)
            await incrementStats()

            safeEnqueue(controller, {
              type: 'complete',
              data: { id },
            })
          } catch {
            safeEnqueue(controller, {
              type: 'error',
              data: { message: 'Failed to save result. Please try again.' },
            })
          }
          safeClose(controller)
        })

        await stream.finalMessage()
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
