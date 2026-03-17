import { getRedisClient } from './upstash'
import {
  RATE_LIMIT_GLOBAL_PER_15MIN,
  RATE_LIMIT_PER_LEVEL_PER_15MIN,
  RATE_LIMIT_ADVANCED_PER_15MIN,
  RATE_LIMIT_WINDOW_SECONDS,
  REDIS_PREFIX,
} from './constants'

interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
}

export async function checkAttemptAllowed(
  ip: string,
  levelId: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  // Global rate limit
  const globalKey = `${REDIS_PREFIX}ratelimit:${ip}:global`
  const globalCount = await redis.incr(globalKey)
  if (globalCount === 1)
    await redis.expire(globalKey, RATE_LIMIT_WINDOW_SECONDS)
  if (globalCount > RATE_LIMIT_GLOBAL_PER_15MIN) {
    const ttl = await redis.ttl(globalKey)
    return {
      allowed: false,
      reason: `SYSTEM LOCKOUT: Too many attempts. ${Math.ceil(ttl / 60)}min cooldown.`,
      retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS,
    }
  }

  // Per-level rate limit
  const levelKey = `${REDIS_PREFIX}ratelimit:${ip}:level:${levelId}`
  const levelCount = await redis.incr(levelKey)
  if (levelCount === 1) await redis.expire(levelKey, RATE_LIMIT_WINDOW_SECONDS)

  const isAdvanced = levelId >= 6
  const levelLimit = isAdvanced
    ? RATE_LIMIT_ADVANCED_PER_15MIN
    : RATE_LIMIT_PER_LEVEL_PER_15MIN

  if (levelCount > levelLimit) {
    const ttl = await redis.ttl(levelKey)
    return {
      allowed: false,
      reason: `FIREWALL COOLDOWN: Try again in ${ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS}s.`,
      retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS,
    }
  }

  return { allowed: true }
}

export async function incrementBudgetCounter(): Promise<number> {
  const redis = getRedisClient()
  const today = new Date().toISOString().split('T')[0]
  const key = `${REDIS_PREFIX}budget:daily:${today}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 172_800) // 48h TTL
  return count
}

export async function getDailyBudget(): Promise<number> {
  const redis = getRedisClient()
  const today = new Date().toISOString().split('T')[0]
  const key = `${REDIS_PREFIX}budget:daily:${today}`
  const count = await redis.get<number>(key)
  return count ?? 0
}
