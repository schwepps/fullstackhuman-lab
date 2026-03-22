import type { AISkill } from './types'

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

export function safeKey(value: string): string {
  if (!SAFE_KEY_PATTERN.test(value)) {
    throw new Error('Invalid Redis key component')
  }
  return value
}

export const REDIS_KEYS = {
  room: (code: string) => `${REDIS_PREFIX}room:${safeKey(code)}`,
  roomPlayers: (code: string) => `${REDIS_PREFIX}room:${safeKey(code)}:players`,
  roundMessages: (code: string, round: number) =>
    `${REDIS_PREFIX}room:${safeKey(code)}:round:${round}`,
  roundVotes: (code: string, round: number) =>
    `${REDIS_PREFIX}room:${safeKey(code)}:round:${round}:votes`,
  roomScores: (code: string) => `${REDIS_PREFIX}room:${safeKey(code)}:scores`,
  roomVerdict: (code: string) => `${REDIS_PREFIX}room:${safeKey(code)}:verdict`,
  roomTip: (code: string) => `${REDIS_PREFIX}room:${safeKey(code)}:tip`,
  result: (id: string) => `${REDIS_PREFIX}result:${safeKey(id)}`,
  rateLimit: (ip: string) => `${REDIS_PREFIX}rate:${safeKey(ip)}`,
  budget: (date: string) => `${REDIS_PREFIX}budget:${safeKey(date)}`,
} as const

// ── Room config ──────────────────────────────────────────────────
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 6
export const TOTAL_ROUNDS = 3
export const ROOM_CODE_LENGTH = 6
export const ROOM_TTL_SECONDS = 24 * 60 * 60 // 24 hours
export const ROUND_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes per player per round

// ── Rate limits ──────────────────────────────────────────────────
export const RATE_LIMITS = {
  actionsPerWindow: 30,
  windowMs: 15 * 60 * 1000,
} as const

// ── Budget ───────────────────────────────────────────────────────
export const BUDGET_WARN_THRESHOLD = 100
export const BUDGET_SHUTDOWN_THRESHOLD = 200

// ── Validation ───────────────────────────────────────────────────
export const MAX_PROMPT_LENGTH = 300
export const MIN_PROMPT_WORDS = 2
export const MAX_PROMPT_WORDS = 25
export const MAX_CRIME_LENGTH = 200
export const MIN_CRIME_LENGTH = 5
export const MAX_NAME_LENGTH = 30
export const MIN_NAME_LENGTH = 2
export const MIN_WORD_VARIETY_RATIO = 0.3

// ── Result TTL ───────────────────────────────────────────────────
export const RESULT_TTL_SECONDS = 30 * 24 * 60 * 60
export const RESULT_ID_PATTERN = /^[a-zA-Z0-9_-]{10,30}$/

// ── Scoring ──────────────────────────────────────────────────────
export const AI_SCORE_WEIGHT = 0.6
export const VOTE_SCORE_WEIGHT = 0.4

// ── Models ───────────────────────────────────────────────────────
export const EVIDENCE_MODEL = 'claude-haiku-4-5'
export const SCORER_MODEL = 'claude-haiku-4-5'
export const VERDICT_MODEL = 'claude-sonnet-4-6'

// ── AI Skills (one per room, assigned at creation) ───────────────
export const AI_SKILLS: AISkill[] = [
  { id: 'role', name: 'Give AI a role', tip: 'Tell the AI WHO it should be' },
  {
    id: 'specific',
    name: 'Be specific',
    tip: 'Details make AI outputs 10x better',
  },
  { id: 'steps', name: 'Step by step', tip: 'Ask AI to think in stages' },
  {
    id: 'compare',
    name: 'Use comparisons',
    tip: 'Show AI what you want by example',
  },
  {
    id: 'bounds',
    name: 'Set boundaries',
    tip: 'Tell AI exactly what format you want',
  },
  {
    id: 'persona',
    name: 'Create a character',
    tip: 'Give the AI a personality to write as',
  },
  {
    id: 'wild',
    name: 'Wild card',
    tip: 'Surprise the judge — any technique goes',
  },
]
