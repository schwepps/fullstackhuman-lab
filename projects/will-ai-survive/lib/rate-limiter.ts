import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  RATE_LIMIT_EVAL_PER_HOUR,
  RATE_LIMIT_EVAL_PER_DAY,
  RATE_LIMIT_GLOBAL_PER_MINUTE,
  DAILY_EVAL_BUDGET,
  TTL_RATE_LIMIT_HOUR,
  TTL_RATE_LIMIT_DAY,
  TTL_RATE_LIMIT_MINUTE,
  TTL_BUDGET_DAY,
} from './constants'

type RateLimitResult = {
  allowed: boolean
  reason?: string
}

/**
 * Check all rate limits before incrementing any counter.
 * This avoids "burning" a user's quota when a later check rejects.
 *
 * EXPIRE NX runs on every increment but only sets a TTL when the key has
 * none: a crash between INCR and EXPIRE cannot leave a key without one, and
 * later requests cannot keep pushing the window's reset time back.
 */
export async function checkEvalRateAllowed(
  ip: string
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  const hourlyKey = REDIS_KEYS.rateLimitEval(ip)
  const dailyKey = REDIS_KEYS.rateLimitEvalDay(ip)
  const globalKey = REDIS_KEYS.rateLimitGlobal
  const budgetKey = REDIS_KEYS.budgetDaily(
    new Date().toISOString().split('T')[0]
  )

  // Read all counters first (without incrementing).
  // Note: read-then-increment has a small TOCTOU window under concurrency
  // (two requests could both read count=4 and both pass). Acceptable for
  // this app's traffic level. A Lua script would fix this if needed.
  const pipeline = redis.pipeline()
  pipeline.get<number>(hourlyKey)
  pipeline.get<number>(dailyKey)
  pipeline.get<number>(globalKey)
  pipeline.get<number>(budgetKey)
  const [hourlyRaw, dailyRaw, globalRaw, budgetRaw] = await pipeline.exec()

  const hourlyCount = (hourlyRaw as number | null) ?? 0
  const dailyCount = (dailyRaw as number | null) ?? 0
  const globalCount = (globalRaw as number | null) ?? 0
  const budgetCount = (budgetRaw as number | null) ?? 0

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

  if (budgetCount >= DAILY_EVAL_BUDGET) {
    return {
      allowed: false,
      reason: 'The AI has had enough for today. Come back tomorrow.',
    }
  }

  // All checks passed — increment all counters and start their windows
  const incrPipeline = redis.pipeline()
  incrPipeline.incr(hourlyKey)
  incrPipeline.expire(hourlyKey, TTL_RATE_LIMIT_HOUR, 'NX')
  incrPipeline.incr(dailyKey)
  incrPipeline.expire(dailyKey, TTL_RATE_LIMIT_DAY, 'NX')
  incrPipeline.incr(globalKey)
  incrPipeline.expire(globalKey, TTL_RATE_LIMIT_MINUTE, 'NX')
  incrPipeline.incr(budgetKey)
  incrPipeline.expire(budgetKey, TTL_BUDGET_DAY, 'NX')
  await incrPipeline.exec()

  return { allowed: true }
}
