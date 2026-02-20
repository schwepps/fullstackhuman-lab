import { headers } from 'next/headers'
import { getClientIp } from '@/lib/utils'
import { consumeFromTimestampMap } from '@/lib/rate-limit-utils'

export const AUTH_MAX_ATTEMPTS = 10
const AUTH_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// Known limitation: in-memory Map resets on serverless cold starts.
// Supabase GoTrue rate limits (auth.rate_limit in config.toml) provide a backstop.
// For production hardening, migrate to a durable store (Upstash Redis / Vercel KV).
const authAttempts = new Map<string, number[]>()

/**
 * Per-IP rate limiter for auth server actions.
 * Returns true if the request is allowed, false if rate-limited.
 * Uses a sliding window of AUTH_WINDOW_MS with AUTH_MAX_ATTEMPTS max.
 */
export async function checkAuthRateLimit(): Promise<boolean> {
  const headerList = await headers()
  const ip = getClientIp(headerList)
  return consumeFromTimestampMap(
    authAttempts,
    ip,
    AUTH_WINDOW_MS,
    AUTH_MAX_ATTEMPTS
  )
}
