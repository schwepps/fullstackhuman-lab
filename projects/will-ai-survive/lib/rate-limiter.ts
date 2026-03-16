import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  RATE_LIMIT_EVAL_PER_HOUR,
  RATE_LIMIT_EVAL_PER_DAY,
  RATE_LIMIT_GLOBAL_PER_MINUTE,
  TTL_RATE_LIMIT_HOUR,
  TTL_RATE_LIMIT_DAY,
  TTL_RATE_LIMIT_MINUTE,
} from './constants'

type RateLimitResult = {
  allowed: boolean
  reason?: string
}

/**
 * Check all rate limits before incrementing any counter.
 * This avoids "burning" a user's quota when a later check rejects.
 *
 * Uses unconditional EXPIRE (idempotent) to avoid TOCTOU race
 * where a crash between INCR and EXPIRE leaves a key without TTL.
 */
export async function checkEvalRateAllowed(
  ip: string
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  const hourlyKey = REDIS_KEYS.rateLimitEval(ip)
  const dailyKey = REDIS_KEYS.rateLimitEvalDay(ip)
  const globalKey = REDIS_KEYS.rateLimitGlobal

  // Read all counters first (without incrementing).
  // Note: read-then-increment has a small TOCTOU window under concurrency
  // (two requests could both read count=4 and both pass). Acceptable for
  // this app's traffic level. A Lua script would fix this if needed.
  const pipeline = redis.pipeline()
  pipeline.get<number>(hourlyKey)
  pipeline.get<number>(dailyKey)
  pipeline.get<number>(globalKey)
  const [hourlyRaw, dailyRaw, globalRaw] = await pipeline.exec()

  const hourlyCount = (hourlyRaw as number | null) ?? 0
  const dailyCount = (dailyRaw as number | null) ?? 0
  const globalCount = (globalRaw as number | null) ?? 0

  // Check all limits before incrementing
  if (hourlyCount >= RATE_LIMIT_EVAL_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Too many evaluations. Try again in an hour.',
    }
  }

  if (dailyCount >= RATE_LIMIT_EVAL_PER_DAY) {
    return {
      allowed: false,
      reason: 'Daily limit reached. Come back tomorrow.',
    }
  }

  if (globalCount >= RATE_LIMIT_GLOBAL_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'High demand right now. Try again in a minute.',
    }
  }

  // All checks passed — increment all counters and set TTLs (idempotent)
  const incrPipeline = redis.pipeline()
  incrPipeline.incr(hourlyKey)
  incrPipeline.expire(hourlyKey, TTL_RATE_LIMIT_HOUR)
  incrPipeline.incr(dailyKey)
  incrPipeline.expire(dailyKey, TTL_RATE_LIMIT_DAY)
  incrPipeline.incr(globalKey)
  incrPipeline.expire(globalKey, TTL_RATE_LIMIT_MINUTE)
  await incrPipeline.exec()

  return { allowed: true }
}
