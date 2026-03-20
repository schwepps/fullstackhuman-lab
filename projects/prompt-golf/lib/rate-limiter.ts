import 'server-only'
import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  RATE_LIMITS,
  MULLIGANS_PER_COURSE,
  RESULT_TTL_SECONDS,
} from './constants'

interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
}

const WINDOW_SECONDS = Math.ceil(RATE_LIMITS.windowMs / 1000)

/**
 * Check rate limits before incrementing any counter.
 * Uses unconditional EXPIRE to avoid TOCTOU race conditions.
 */
export async function checkAttemptAllowed(
  ip: string,
  challengeId: string,
  isPractice: boolean
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  const globalKey = REDIS_KEYS.globalAttempts(ip)
  const challengeKey = REDIS_KEYS.attempts(ip, challengeId)

  const readPipeline = redis.pipeline()
  readPipeline.get<number>(globalKey)
  readPipeline.get<number>(challengeKey)
  const [globalRaw, challengeRaw] = await readPipeline.exec()

  const globalCount = (globalRaw as number | null) ?? 0
  const challengeCount = (challengeRaw as number | null) ?? 0

  // Check global limit
  if (globalCount >= RATE_LIMITS.globalPerWindow) {
    const ttl = await redis.ttl(globalKey)
    return {
      allowed: false,
      reason: `Slow down, Tiger. Too many swings. Try again in ${Math.ceil(Math.max(ttl, 1) / 60)} minutes.`,
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    }
  }

  // Check per-challenge limit
  const challengeLimit = isPractice
    ? RATE_LIMITS.practicePerChallengePerWindow
    : RATE_LIMITS.perChallengePerWindow

  if (challengeCount >= challengeLimit) {
    const ttl = await redis.ttl(challengeKey)
    return {
      allowed: false,
      reason: isPractice
        ? `Driving range closed temporarily. Try again in ${ttl > 0 ? ttl : WINDOW_SECONDS}s.`
        : `Hole cooldown active. Try again in ${ttl > 0 ? ttl : WINDOW_SECONDS}s.`,
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    }
  }

  // All checks passed — increment
  const incrPipeline = redis.pipeline()
  incrPipeline.incr(globalKey)
  incrPipeline.expire(globalKey, WINDOW_SECONDS)
  incrPipeline.incr(challengeKey)
  incrPipeline.expire(challengeKey, WINDOW_SECONDS)
  await incrPipeline.exec()

  return { allowed: true }
}

/**
 * Increment and return daily budget counter.
 */
export async function incrementBudgetCounter(): Promise<number> {
  const redis = getRedisClient()
  const today = new Date().toISOString().split('T')[0]
  const key = REDIS_KEYS.budget(today)
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, 172_800) // 48h TTL, idempotent
  const [countRaw] = await pipeline.exec()
  return (countRaw as number | null) ?? 1
}

/**
 * Get daily budget count.
 */
export async function getDailyBudget(): Promise<number> {
  const redis = getRedisClient()
  const today = new Date().toISOString().split('T')[0]
  const key = REDIS_KEYS.budget(today)
  const count = await redis.get<number>(key)
  return count ?? 0
}

/**
 * Increment server-side attempt count for scoring accuracy.
 * Prevents sessionId rotation to reset counts.
 */
export async function incrementAttemptCount(
  sessionId: string,
  challengeId: string
): Promise<number> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.bestSwing(sessionId, challengeId)
  const pipeline = redis.pipeline()
  pipeline.incr(key + ':attempts')
  pipeline.expire(key + ':attempts', RESULT_TTL_SECONDS)
  const [countRaw] = await pipeline.exec()
  return (countRaw as number | null) ?? 1
}

/**
 * Get current attempt count for a session + challenge.
 */
export async function getAttemptCount(
  sessionId: string,
  challengeId: string
): Promise<number> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.bestSwing(sessionId, challengeId) + ':attempts'
  const count = await redis.get<number>(key)
  return count ?? 0
}

/**
 * Check and consume a mulligan for the given course.
 * Uses SETNX + DECR to avoid TOCTOU race on initialization.
 */
export async function consumeMulligan(
  sessionId: string,
  course: string
): Promise<boolean> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.mulligans(sessionId, course)

  // Initialize atomically if not set (SETNX = set-if-not-exists)
  await redis.set(key, MULLIGANS_PER_COURSE, {
    ex: RESULT_TTL_SECONDS,
    nx: true,
  })

  // Atomically decrement and check
  const remaining = await redis.decr(key)
  if (remaining < 0) {
    // Over-decremented — restore and reject
    await redis.incr(key)
    return false
  }

  return true
}

/**
 * Get remaining mulligans for a course.
 */
export async function getMulligansRemaining(
  sessionId: string,
  course: string
): Promise<number> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.mulligans(sessionId, course)
  const count = await redis.get<number>(key)
  return count ?? MULLIGANS_PER_COURSE
}
