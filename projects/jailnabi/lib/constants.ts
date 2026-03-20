// ── Site ─────────────────────────────────────────────────────────
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return `http://localhost:${process.env.PORT ?? '3000'}`
}

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// ── Ko-fi ────────────────────────────────────────────────────────
export const KOFI_URL = 'https://ko-fi.com/fullstackhuman'

// ── Redis keys ───────────────────────────────────────────────────
export const REDIS_PREFIX = 'fsh:jn:'

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9._:-]+$/

/** Validate Redis key components to prevent key injection */
export function safeKey(value: string): string {
  if (!SAFE_KEY_PATTERN.test(value)) {
    throw new Error(`Invalid Redis key component: ${value.slice(0, 40)}`)
  }
  return value
}

export const REDIS_KEYS = {
  // Crime pool
  crimes: `${REDIS_PREFIX}crimes`,
  crime: (id: string) => `${REDIS_PREFIX}crime:${safeKey(id)}`,

  // Rounds
  currentRound: `${REDIS_PREFIX}round:current`,
  round: (id: string) => `${REDIS_PREFIX}round:${safeKey(id)}`,
  roundEvidence: (id: string) => `${REDIS_PREFIX}round:${safeKey(id)}:evidence`,
  roundDefense: (id: string) => `${REDIS_PREFIX}round:${safeKey(id)}:defense`,
  roundVerdict: (id: string) => `${REDIS_PREFIX}round:${safeKey(id)}:verdict`,
  roundConfession: (id: string) =>
    `${REDIS_PREFIX}round:${safeKey(id)}:confession`,
  roundsHistory: `${REDIS_PREFIX}rounds:history`,

  // Criminal records
  record: (memberId: string) => `${REDIS_PREFIX}record:${safeKey(memberId)}`,
  recordConvictions: (memberId: string) =>
    `${REDIS_PREFIX}record:${safeKey(memberId)}:convictions`,
  recordConfessions: (memberId: string) =>
    `${REDIS_PREFIX}record:${safeKey(memberId)}:confessions`,

  // Leaderboards
  leaderboardConvictions: `${REDIS_PREFIX}leaderboard:convictions`,
  leaderboardWins: `${REDIS_PREFIX}leaderboard:wins`,

  // Shareable results
  result: (id: string) => `${REDIS_PREFIX}result:${safeKey(id)}`,

  // Rate limiting
  rateLimit: (ip: string) => `${REDIS_PREFIX}rate:${safeKey(ip)}`,

  // Budget
  budget: (date: string) => `${REDIS_PREFIX}budget:${safeKey(date)}`,
} as const

// ── Rate limits ──────────────────────────────────────────────────
export const RATE_LIMITS = {
  actionsPerWindow: 20,
  windowMs: 15 * 60 * 1000, // 15 minutes
} as const

// ── Budget ───────────────────────────────────────────────────────
export const BUDGET_WARN_THRESHOLD = 50
export const BUDGET_SHUTDOWN_THRESHOLD = 100

// ── Evidence types ───────────────────────────────────────────────
import type { EvidenceType } from './types'

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  slack: 'Teams/Slack Message',
  linkedin: 'LinkedIn Post',
  email: 'Email Chain',
  meeting: 'Meeting Transcript',
  expense: 'Expense Report',
}

// ── Validation ───────────────────────────────────────────────────
export const MAX_PROMPT_LENGTH = 300
export const MIN_PROMPT_WORDS = 2
export const MAX_PROMPT_WORDS = 25
export const MAX_CRIME_LENGTH = 200
export const MIN_CRIME_LENGTH = 5
export const MAX_CONFESSION_LENGTH = 500
export const MIN_WORD_VARIETY_RATIO = 0.3

// ── Prosecution thresholds ──────────────────────────────────────
export const MIN_EVIDENCE_FOR_COURT = 2
export const DEFENSE_DEADLINE_MS = 4 * 60 * 60 * 1000 // 4 hours
export const CONVICT_PICK_DEADLINE_MS = 12 * 60 * 60 * 1000 // 12 hours
export const MAX_ROUNDS_HISTORY = 200
export const MAX_CRIMES_IN_POOL = 50

// ── Result TTL ───────────────────────────────────────────────────
export const RESULT_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days
export const RESULT_ID_PATTERN = /^[a-zA-Z0-9_-]{10,30}$/

// ── Models ───────────────────────────────────────────────────────
/** Generates fake evidence from player prompts */
export const EVIDENCE_MODEL = 'claude-haiku-4-5'
/** Scores accusations, produces verdict and skill breakdown */
export const VERDICT_MODEL = 'claude-sonnet-4-6'
/** Selects crimes from pool when convict doesn't pick */
export const CRIME_SELECTOR_MODEL = 'claude-haiku-4-5'
