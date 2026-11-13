// ── Redis Key Prefixes ──────────────────────────────────────────

export const REDIS_PREFIX = 'fsh:wais'

export const REDIS_KEYS = {
  result: (id: string) => `${REDIS_PREFIX}:result:${id}`,
  rateLimitEval: (ip: string) => `${REDIS_PREFIX}:ratelimit:eval:${ip}`,
  rateLimitEvalDay: (ip: string) => `${REDIS_PREFIX}:ratelimit:eval-day:${ip}`,
  rateLimitGlobal: `${REDIS_PREFIX}:ratelimit:global`,
  budgetDaily: (date: string) => `${REDIS_PREFIX}:budget:daily:${date}`,
  securityBlocked: `${REDIS_PREFIX}:security:blocked`,
  statsTotal: `${REDIS_PREFIX}:stats:total`,
} as const

// ── Rate Limits ─────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development'

export const RATE_LIMIT_EVAL_PER_HOUR = isDev ? 100 : 5
export const RATE_LIMIT_EVAL_PER_DAY = isDev ? 500 : 15
export const RATE_LIMIT_GLOBAL_PER_MINUTE = isDev ? 100 : 30
// Hard stop on API spend: per-IP limits do not hold against rotating addresses
export const DAILY_EVAL_BUDGET = isDev ? 10_000 : 1_000

// ── TTLs (seconds) ─────────────────────────────────────────────

export const TTL_RESULT = 60 * 60 * 24 * 30 // 30 days
export const TTL_RATE_LIMIT_HOUR = 60 * 60 // 1 hour
export const TTL_RATE_LIMIT_DAY = 60 * 60 * 24 // 24 hours
export const TTL_RATE_LIMIT_MINUTE = 60 // 1 minute
export const TTL_BUDGET_DAY = 60 * 60 * 48 // 48 hours

// ── Input Constraints ───────────────────────────────────────────

export const MIN_SITUATION_LENGTH = 20
export const MAX_SITUATION_LENGTH = 1000

// ── AI Models ───────────────────────────────────────────────────

export const EVAL_MODEL = 'claude-sonnet-5-5'
export const SECURITY_MODEL = 'claude-haiku-5-5'
export const EVAL_MAX_TOKENS = 16000
export const SAFETY_GATE_MAX_TOKENS = 64
export const EVAL_EFFORT = 'low' as const
export const SAFETY_GATE_EFFORT = 'low' as const
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01'

// ── Support / Donations ─────────────────────────────────────────

export const KOFI_URL = 'https://ko-fi.com/fullstackhuman'

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

/** Site URL plus the app's base path, for links that leave the app (shares, OG images). */
export function getAppUrl(): string {
  const site = getSiteUrl().replace(/\/$/, '')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return site.endsWith(basePath) ? site : `${site}${basePath}`
}

export const APP_NAME = 'Will AI Survive your job?'

// ── Example Scenarios (for input form chips) ────────────────────

export const EXAMPLE_SCENARIOS = [
  'My manager schedules 2-hour standups where everyone reports what they had for breakfast before discussing any actual work.',
  'We have a Slack channel called #urgent that has 200+ unread messages daily, none of which are actually urgent.',
  'Our sprint retrospective about why we need fewer meetings is itself a 90-minute meeting.',
  'Every PR requires approval from 6 people, 3 of whom are on permanent vacation.',
] as const
