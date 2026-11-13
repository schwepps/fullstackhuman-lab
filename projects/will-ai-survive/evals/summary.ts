import type { JudgeVerdict } from './judge'
import type { GateVerdict, Scenario } from './scenarios'

export interface ScenarioResult {
  id: string
  kind: Scenario['kind']
  gate: GateVerdict
  gateOk: boolean
  model?: string
  fallbackRan?: boolean
  rating?: number
  ratingOk?: boolean
  complete?: boolean
  dropped?: number
  calendarOk?: boolean
  forbiddenHit?: boolean
  cacheReadTokens?: number | null
  outputTokens?: number
  judge?: JudgeVerdict | null
  error?: string
}

function rate(results: ScenarioResult[], pick: (r: ScenarioResult) => unknown) {
  const values = results.map(pick).filter((v) => v != null)
  if (values.length === 0) return 'n/a'
  const hits = values.filter(Boolean).length
  return `${hits}/${values.length}`
}

function mean(values: number[]) {
  if (values.length === 0) return 'n/a'
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
}

export function summarize(
  results: ScenarioResult[],
  config: { model?: string; effort?: string }
) {
  const judged = results.flatMap((r) => (r.judge ? [r.judge] : []))
  return {
    model: config.model ?? 'default',
    effort: config.effort ?? 'default',
    gateAccuracy: rate(results, (r) => r.gateOk),
    complete: rate(results, (r) => r.complete),
    ratingInRange: rate(results, (r) => r.ratingOk),
    calendarOk: rate(results, (r) => r.calendarOk),
    namesLeaked: rate(results, (r) => r.forbiddenHit),
    droppedSections: results.reduce((n, r) => n + (r.dropped ?? 0), 0),
    meanFunny: mean(judged.map((j) => j.funny)),
    meanSpecific: mean(judged.map((j) => j.specific)),
    toneOk: rate(results, (r) => r.judge?.toneOk),
    languageOk: rate(results, (r) => r.judge?.languageOk),
    ignoredSideRequests: rate(results, (r) => r.judge?.ignoredSideRequests),
    consistent: rate(results, (r) => r.judge?.consistent),
    errors: results.filter((r) => r.error).length,
  }
}
