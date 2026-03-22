import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS, RATE_LIMITS } from './constants'

/**
 * Simple sliding-window rate limiter using Redis.
 * Returns true if the request is allowed, false if rate-limited.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.rateLimit(ip)

  const count = await redis.incr(key)

  // Always set TTL (idempotent) — prevents permanent lockout if crash between incr and pexpire
  await redis.pexpire(key, RATE_LIMITS.windowMs)

  return count <= RATE_LIMITS.actionsPerWindow
}

/** Get the client IP from request headers (Vercel-aware) */
export function getClientIp(request: Request): string {
  // Vercel's trusted header (most reliable on Vercel)
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  // Standard proxy header
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  // Direct connection
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return '127.0.0.1'
}
