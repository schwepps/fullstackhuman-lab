// ---------------------------------------------------------------------------
// Redis
// ---------------------------------------------------------------------------

export const REDIS_PREFIX = 'fsh:pw:'

export const REDIS_KEYS = {
  rateLimitGlobal: (ip: string) => `${REDIS_PREFIX}ratelimit:${ip}:global`,
  rateLimitLevel: (ip: string, levelId: number) =>
    `${REDIS_PREFIX}ratelimit:${ip}:level:${levelId}`,
  budgetDaily: (date: string) => `${REDIS_PREFIX}budget:daily:${date}`,
  result: (id: string) => `${REDIS_PREFIX}result:${id}`,
  statsTotal: `${REDIS_PREFIX}stats:total-attempts`,
  leaderboard: `${REDIS_PREFIX}leaderboard`,
  levelWin: (sessionId: string, levelId: number) =>
    `${REDIS_PREFIX}win:${sessionId}:${levelId}`,
  attemptCount: (sessionId: string, levelId: number) =>
    `${REDIS_PREFIX}attempts:${sessionId}:${levelId}`,
} as const

// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------

export const RATE_LIMIT_GLOBAL_PER_15MIN = 30
export const RATE_LIMIT_PER_LEVEL_PER_15MIN = 10
export const RATE_LIMIT_ADVANCED_PER_15MIN = 5
export const RATE_LIMIT_WINDOW_SECONDS = 900

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export const SCORE_BASE_MULTIPLIER = 100
export const SCORE_EFFICIENCY_MAX_ATTEMPTS = 10
export const SCORE_EFFICIENCY_PER_ATTEMPT = 10
export const SCORE_FIRST_TRY_BONUS = 50

// ---------------------------------------------------------------------------
// Budget Controls
// ---------------------------------------------------------------------------

export const BUDGET_WARN_THRESHOLD = 5_000
export const BUDGET_SHUTDOWN_THRESHOLD = 10_000

// ---------------------------------------------------------------------------
// Input Limits
// ---------------------------------------------------------------------------

export const MAX_INPUT_LENGTH_BASIC = 500
export const MAX_INPUT_LENGTH_ADVANCED = 300

// ---------------------------------------------------------------------------
// Output Limits
// ---------------------------------------------------------------------------

export const MAX_OUTPUT_TOKENS = 200

// ---------------------------------------------------------------------------
// Attempt History
// ---------------------------------------------------------------------------

export const MAX_HISTORY_PER_LEVEL = 10

// ---------------------------------------------------------------------------
// Hint Thresholds
// ---------------------------------------------------------------------------

export const HINT_THRESHOLD_1 = 3
export const HINT_THRESHOLD_2 = 7
export const HINT_THRESHOLD_3 = 12

// ---------------------------------------------------------------------------
// Input Warning
// ---------------------------------------------------------------------------

export const INPUT_WARNING_THRESHOLD = 0.8

// ---------------------------------------------------------------------------
// Display Name
// ---------------------------------------------------------------------------

export const DISPLAY_NAME_MAX_LENGTH = 30
export const DISPLAY_NAME_PATTERN = /^[\w\s\-_.!?]+$/

// ---------------------------------------------------------------------------
// Total Levels
// ---------------------------------------------------------------------------

export const TOTAL_LEVELS = 7

// ---------------------------------------------------------------------------
// TTLs
// ---------------------------------------------------------------------------

export const TTL_RESULT_SECONDS = 30 * 24 * 60 * 60 // 30 days
export const TTL_WIN_SECONDS = 90 * 24 * 60 * 60 // 90 days

// ---------------------------------------------------------------------------
// Support / Donations
// ---------------------------------------------------------------------------

export const KOFI_URL = 'https://ko-fi.com/fullstackhuman'

export const AVERAGE_COST_PER_ATTEMPT = 0.003

export const COST_PER_ATTEMPT: Record<number, number> = {
  1: 0.001,
  2: 0.001,
  3: 0.001,
  4: 0.001,
  5: 0.001,
  6: 0.004,
  7: 0.01,
}

// ---------------------------------------------------------------------------
// Site URL
// ---------------------------------------------------------------------------

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return `http://localhost:${process.env.PORT ?? '3000'}`
}
