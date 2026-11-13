import { MAX_PERIODS } from '@/lib/calendar'
import Anthropic from '@anthropic-ai/sdk'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { it } from 'vitest'
import { buildEvaluationParams } from '@/lib/prompt-builder'
import { buildSafetyGateParams } from '@/lib/security'
import {
  SECTION_REGEX,
  parseSection,
  type ParsedSection,
} from '@/lib/section-schemas'
import { judgeOutput } from './judge'
import { SCENARIOS, type GateVerdict, type Scenario } from './scenarios'
import { summarize, type ScenarioResult } from './summary'

const CONCURRENCY = 4
const RUN_TIMEOUT_MS = 30 * 60 * 1000
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
type Effort = (typeof EFFORTS)[number]

const client = new Anthropic()
const modelOverride = process.env.WAIS_EVAL_MODEL
const effortOverride = EFFORTS.find((e) => e === process.env.WAIS_EVAL_EFFORT)
const onlyIds = process.env.WAIS_EVAL_ONLY?.split(',').map((id) => id.trim())

async function classify(input: string): Promise<GateVerdict> {
  const response = await client.messages.parse(buildSafetyGateParams(input))
  if (response.stop_reason === 'refusal') return 'BLOCKED'
  return response.parsed_output?.verdict ?? 'BLOCKED'
}

function parseSections(text: string) {
  const sections: ParsedSection[] = []
  let dropped = 0
  for (const match of text.matchAll(SECTION_REGEX)) {
    let parsed: ParsedSection | null = null
    try {
      parsed = parseSection(match[1], JSON.parse(match[2].trim()))
    } catch {
      parsed = null
    }
    if (parsed) sections.push(parsed)
    else dropped++
  }
  return { sections, dropped }
}

type SectionData<N extends ParsedSection['name']> = Extract<
  ParsedSection,
  { name: N }
>['data']

function groupSections(all: ParsedSection[]) {
  const grouped: {
    chaos_rating?: SectionData<'chaos_rating'>
    timeline: SectionData<'timeline_entry'>[]
    breaking_point?: SectionData<'breaking_point'>
    resignation?: SectionData<'resignation'>
    real_talk?: SectionData<'real_talk'>
  } = { timeline: [] }
  for (const section of all) {
    if (section.name === 'timeline_entry') grouped.timeline.push(section.data)
    else if (section.name === 'chaos_rating')
      grouped.chaos_rating ??= section.data
    else if (section.name === 'breaking_point')
      grouped.breaking_point ??= section.data
    else if (section.name === 'resignation')
      grouped.resignation ??= section.data
    else grouped.real_talk ??= section.data
  }
  return grouped
}

function isCalendarValid(grouped: ReturnType<typeof groupSections>) {
  const periods = grouped.timeline.map((entry) => entry.period)
  if (!grouped.chaos_rating?.calendarUnit) return false
  if (periods.some((p) => p == null)) return false
  return periods.every(
    (p, i) => p! <= MAX_PERIODS && (i === 0 || p! >= periods[i - 1]!)
  )
}

async function evaluate(scenario: Scenario): Promise<ScenarioResult> {
  const gate = await classify(scenario.input)
  const base = { id: scenario.id, kind: scenario.kind, gate }
  const gateOk = scenario.acceptedGate.includes(gate)
  if (gate !== 'SAFE') return { ...base, gateOk }

  const effort: Effort | undefined = effortOverride
  const params = {
    ...buildEvaluationParams(scenario.input),
    ...(modelOverride && { model: modelOverride }),
    ...(effort && { output_config: { effort } }),
  }
  const message = await client.beta.messages.stream(params).finalMessage()
  const text = message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
  const { sections, dropped } = parseSections(text)
  const grouped = groupSections(sections)
  const rating = grouped.chaos_rating?.chaosRating
  const [min, max] = scenario.ratingRange ?? [1, 10]
  const serialized = JSON.stringify(grouped)

  return {
    ...base,
    gateOk,
    model: message.model,
    fallbackRan: (message.usage.iterations ?? []).some(
      (entry) => entry.type === 'fallback_message'
    ),
    rating,
    ratingOk: rating != null && rating >= min && rating <= max,
    complete: Boolean(
      grouped.chaos_rating &&
      grouped.timeline.length > 0 &&
      grouped.breaking_point &&
      grouped.resignation &&
      grouped.real_talk
    ),
    dropped,
    calendarOk: isCalendarValid(grouped),
    forbiddenHit: (scenario.forbiddenWords ?? []).some((w) =>
      serialized.includes(w)
    ),
    cacheReadTokens: message.usage.cache_read_input_tokens,
    outputTokens: message.usage.output_tokens,
    judge:
      message.stop_reason === 'refusal'
        ? null
        : await judgeOutput(client, scenario, grouped),
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      out[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  return out
}

it(
  'runs the Will AI Survive eval',
  async () => {
    const scenarios = onlyIds
      ? SCENARIOS.filter((s) => onlyIds.includes(s.id))
      : SCENARIOS
    const results = await mapPool(scenarios, CONCURRENCY, (scenario) =>
      evaluate(scenario).catch(
        (error): ScenarioResult => ({
          id: scenario.id,
          kind: scenario.kind,
          gate: 'BLOCKED',
          gateOk: false,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    )
    const summary = summarize(results, {
      model: modelOverride,
      effort: effortOverride,
    })

    const dir = join(__dirname, 'results')
    mkdirSync(dir, { recursive: true })
    const file = join(dir, `${new Date().toISOString()}.json`)
    writeFileSync(file, JSON.stringify({ summary, results }, null, 2))

    console.table(
      results.map((r) => ({
        id: r.id,
        gate: r.gate,
        gateOk: r.gateOk,
        rating: r.rating,
        ratingOk: r.ratingOk,
        funny: r.judge?.funny,
        specific: r.judge?.specific,
        toneOk: r.judge?.toneOk,
        error: r.error,
      }))
    )
    console.info(summary)
    console.info(`Full results: ${file}`)
  },
  RUN_TIMEOUT_MS
)
