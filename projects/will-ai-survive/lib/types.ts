// ── Evaluation Result ────────────────────────────────────────────

export type TimelineEntry = {
  time: string // "Day 1, 9:00 AM" or "Hour 3"
  event: string // What happened (2-3 sentences max)
  thought?: string // AI's internal monologue (parenthetical aside)
  sanityLevel: string // "73%" → "2%" → "-41%"
}

export type EvaluationResult = {
  id: string // nanoid, 12 chars
  situation: string // user input (sanitized)
  chaosRating: number // 1-10
  chaosLabel: string // e.g. "Actively praying for a power outage"
  survivalDuration: string // e.g. "2 days, 14 hours"
  timeline: TimelineEntry[] // 5-8 entries, escalating madness
  breakingPoint: string // The exact moment AI snapped
  resignationLetter: string // Dramatic, situation-specific
  oneLineSummary: string // For OG description / share text
  realTalkInsight: string // Genuine actionable insight
  createdAt: number
  upvotes: number
}

// ── SSE Event Types (server → client) ───────────────────────────

export type SSEChaosEvent = {
  type: 'chaos_rating'
  data: {
    chaosRating: number
    chaosLabel: string
    survivalDuration: string
    empathyNote?: string
  }
}

export type SSETimelineEvent = {
  type: 'timeline_entry'
  data: TimelineEntry
}

export type SSEBreakingPointEvent = {
  type: 'breaking_point'
  data: { breakingPoint: string }
}

export type SSEResignationEvent = {
  type: 'resignation'
  data: {
    resignationLetter: string
    oneLineSummary: string
  }
}

export type SSERealTalkEvent = {
  type: 'real_talk'
  data: { insight: string }
}

export type SSECompleteEvent = {
  type: 'complete'
  data: { id: string }
}

export type SSEErrorEvent = {
  type: 'error'
  data: { message: string }
}

export type SSEEvent =
  | SSEChaosEvent
  | SSETimelineEvent
  | SSEBreakingPointEvent
  | SSEResignationEvent
  | SSERealTalkEvent
  | SSECompleteEvent
  | SSEErrorEvent

// ── Security ────────────────────────────────────────────────────

export type SafetyCheckResult = {
  safe: boolean
  reason: 'safe' | 'blocked' | 'injection' | 'offtopic'
}
