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

type Counter = { key: string; ttl: number }

/**
 * Count first, then compare: parallel requests cannot all read the same
 * count and pass. Shared counters are only counted once the per-IP limits
 * pass, so one noisy IP cannot spend everyone's daily budget.
 *
 * EXPIRE NX starts each window once, so later requests cannot push it back.
 */
async function incrementAll(counters: Counter[]): Promise<number[]> {
  const pipeline = getRedisClient().pipeline()
  for (const { key, ttl } of counters) {
    pipeline.incr(key)
    pipeline.expire(key, ttl, 'NX')
  }
  const results = await pipeline.exec()
  return counters.map((_, i) => (results[i * 2] as number | null) ?? 0)
}

export async function checkEvalRateAllowed(
  ip: string
): Promise<RateLimitResult> {
  const [hourlyCount, dailyCount] = await incrementAll([
    { key: REDIS_KEYS.rateLimitEval(ip), ttl: TTL_RATE_LIMIT_HOUR },
    { key: REDIS_KEYS.rateLimitEvalDay(ip), ttl: TTL_RATE_LIMIT_DAY },
  ])

  if (hourlyCount > RATE_LIMIT_EVAL_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Too many evaluations. Try again in an hour.',
    }
  }

  if (dailyCount > RATE_LIMIT_EVAL_PER_DAY) {
    return {
      allowed: false,
      reason: 'Daily limit reached. Come back tomorrow.',
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const [globalCount, budgetCount] = await incrementAll([
    { key: REDIS_KEYS.rateLimitGlobal, ttl: TTL_RATE_LIMIT_MINUTE },
    { key: REDIS_KEYS.budgetDaily(today), ttl: TTL_BUDGET_DAY },
  ])

  if (globalCount > RATE_LIMIT_GLOBAL_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'High demand right now. Try again in a minute.',
    }
  }

  if (budgetCount > DAILY_EVAL_BUDGET) {
    return {
      allowed: false,
      reason: 'The AI has had enough for today. Come back tomorrow.',
    }
  }

  return { allowed: true }
}
