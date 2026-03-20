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
export const REDIS_PREFIX = 'fsh:pg:'

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9._:-]+$/

/** Validate Redis key components to prevent key injection */
function safeKey(value: string): string {
  if (!SAFE_KEY_PATTERN.test(value)) {
    throw new Error(`Invalid Redis key component: ${value.slice(0, 40)}`)
  }
  return value
}

export const REDIS_KEYS = {
  attempts: (ip: string, challengeId: string) =>
    `${REDIS_PREFIX}attempts:${safeKey(ip)}:${safeKey(challengeId)}`,
  globalAttempts: (ip: string) => `${REDIS_PREFIX}global:${safeKey(ip)}`,
  mulligans: (sessionId: string, course: string) =>
    `${REDIS_PREFIX}mulligans:${safeKey(sessionId)}:${safeKey(course)}`,
  budget: (date: string) => `${REDIS_PREFIX}budget:${safeKey(date)}`,
  result: (id: string) => `${REDIS_PREFIX}result:${safeKey(id)}`,
  leaderboard: (course: string) =>
    `${REDIS_PREFIX}leaderboard:${safeKey(course)}`,
  bestSwing: (sessionId: string, challengeId: string) =>
    `${REDIS_PREFIX}best:${safeKey(sessionId)}:${safeKey(challengeId)}`,
} as const

// ── Rate limits ──────────────────────────────────────────────────
export const RATE_LIMITS = {
  globalPerWindow: 30,
  perChallengePerWindow: 8,
  practicePerChallengePerWindow: 6,
  windowMs: 15 * 60 * 1000, // 15 minutes
} as const

// ── Budget ───────────────────────────────────────────────────────
export const BUDGET_WARN_THRESHOLD = 2000
export const BUDGET_SHUTDOWN_THRESHOLD = 4000

// ── Scoring ──────────────────────────────────────────────────────
export const ATTEMPT_PENALTY_MULTIPLIER = 0.25
export const MULLIGANS_PER_COURSE = 2

// ── Costs (USD) ──────────────────────────────────────────────────
export const COST_PER_SWING = 0.004
export const COST_PER_PRACTICE = 0.001

// ── Limits ───────────────────────────────────────────────────────
export const MAX_PROMPT_LENGTH = 500
export const MIN_PROMPT_WORDS = 2
export const MAX_PROMPT_WORDS = 100

// ── Result TTL ───────────────────────────────────────────────────
export const RESULT_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

// ── Models ───────────────────────────────────────────────────────
/** Generates TypeScript code from the player's natural language prompt */
export const GENERATOR_MODEL = 'claude-haiku-4-5-20251001'
/** Evaluates generated code correctness against test cases */
export const JUDGE_MODEL = 'claude-sonnet-4-6-20250514'
/** Produces educational swing analysis (why the prompt worked/failed) */
export const ANALYZER_MODEL = 'claude-haiku-4-5-20251001'

// ── Courses ──────────────────────────────────────────────────────
export const COURSES = {
  'front-9': {
    id: 'front-9',
    name: 'The Front 9',
    subtitle: 'Utility Functions',
    description:
      'Learn the fundamentals of prompt engineering through classic coding challenges.',
    holes: 9,
    isLocked: false,
  },
  'public-9': {
    id: 'public-9',
    name: 'The Public Course',
    subtitle: 'For Everyone',
    description: 'Prompt engineering for non-developers. Coming soon.',
    holes: 9,
    isLocked: true,
  },
} as const
