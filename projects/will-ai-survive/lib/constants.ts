// ── Redis Key Prefixes ──────────────────────────────────────────

export const REDIS_PREFIX = 'fsh:wais'

export const REDIS_KEYS = {
  result: (id: string) => `${REDIS_PREFIX}:result:${id}`,
  rateLimitEval: (ip: string) => `${REDIS_PREFIX}:ratelimit:eval:${ip}`,
  rateLimitEvalDay: (ip: string) => `${REDIS_PREFIX}:ratelimit:eval-day:${ip}`,
  rateLimitGlobal: `${REDIS_PREFIX}:ratelimit:global`,
  securityBlocked: `${REDIS_PREFIX}:security:blocked`,
  statsTotal: `${REDIS_PREFIX}:stats:total`,
} as const

// ── Rate Limits ─────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development'

export const RATE_LIMIT_EVAL_PER_HOUR = isDev ? 100 : 5
export const RATE_LIMIT_EVAL_PER_DAY = isDev ? 500 : 15
export const RATE_LIMIT_GLOBAL_PER_MINUTE = isDev ? 100 : 30

// ── TTLs (seconds) ─────────────────────────────────────────────

export const TTL_RESULT = 60 * 60 * 24 * 30 // 30 days
export const TTL_RATE_LIMIT_HOUR = 60 * 60 // 1 hour
export const TTL_RATE_LIMIT_DAY = 60 * 60 * 24 // 24 hours
export const TTL_RATE_LIMIT_MINUTE = 60 // 1 minute

// ── Input Constraints ───────────────────────────────────────────

export const MIN_SITUATION_LENGTH = 20
export const MAX_SITUATION_LENGTH = 1000

// ── AI Models ───────────────────────────────────────────────────

export const EVAL_MODEL = 'claude-sonnet-4-6'
export const SECURITY_MODEL = 'claude-haiku-4-5'
export const EVAL_MAX_TOKENS = 6144

// ── App ─────────────────────────────────────────────────────────

/**
 * Base URL for the app. Derived from environment:
 * - NEXT_PUBLIC_SITE_URL (set in Vercel/production)
 * - VERCEL_PROJECT_PRODUCTION_URL (auto-set by Vercel)
 * - Falls back to localhost for local dev
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return `http://localhost:${process.env.PORT ?? '3000'}`
}
export const APP_NAME = 'Will AI Survive This Job?'

// ── Example Scenarios (for input form chips) ────────────────────

export const EXAMPLE_SCENARIOS = [
  'My manager schedules 2-hour standups where everyone reports what they had for breakfast before discussing any actual work.',
  'We have a Slack channel called #urgent that has 200+ unread messages daily, none of which are actually urgent.',
  'Our sprint retrospective about why we need fewer meetings is itself a 90-minute meeting.',
  'Every PR requires approval from 6 people, 3 of whom are on permanent vacation.',
] as const
