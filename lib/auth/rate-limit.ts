import { headers } from 'next/headers'
import { getClientIp } from '@/lib/utils'
import {
  consumeWithFallback,
  createLazyRateLimiter,
} from '@/lib/rate-limit-utils'

export const AUTH_MAX_ATTEMPTS = 10
const AUTH_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// In-memory fallback for when Redis is unavailable (local dev, Upstash outage)
const authAttempts = new Map<string, number[]>()

const getAuthLimiter = createLazyRateLimiter({
  maxRequests: AUTH_MAX_ATTEMPTS,
  window: '15 m',
  prefix: 'ratelimit:auth:ip',
})

/**
 * Per-IP rate limiter for auth server actions.
 * Returns true if the request is allowed, false if rate-limited.
 * Uses Upstash Redis with in-memory fallback.
 */
export async function checkAuthRateLimit(): Promise<boolean> {
  const headerList = await headers()
  const ip = getClientIp(headerList)
  return consumeWithFallback(
    getAuthLimiter(),
    ip,
    authAttempts,
    AUTH_WINDOW_MS,
    AUTH_MAX_ATTEMPTS
  )
}
