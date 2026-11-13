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
 * Count this swing, then compare against the limits.
 *
 * Incrementing first makes the check atomic: parallel requests cannot all
 * read the same count and pass. EXPIRE NX starts the window once, so a
 * steady trickle of requests cannot keep pushing the reset time back.
 */
export async function checkAttemptAllowed(
  ip: string,
  challengeId: string,
  isPractice: boolean
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  const globalKey = REDIS_KEYS.globalAttempts(ip)
  const challengeKey = REDIS_KEYS.attempts(ip, challengeId)

  const pipeline = redis.pipeline()
  pipeline.incr(globalKey)
  pipeline.expire(globalKey, WINDOW_SECONDS, 'NX')
  pipeline.incr(challengeKey)
  pipeline.expire(challengeKey, WINDOW_SECONDS, 'NX')
  const [globalRaw, , challengeRaw] = await pipeline.exec()

  const globalCount = (globalRaw as number | null) ?? 0
  const challengeCount = (challengeRaw as number | null) ?? 0

  if (globalCount > RATE_LIMITS.globalPerWindow) {
    const ttl = await redis.ttl(globalKey)
    return {
      allowed: false,
      reason: `Slow down, Tiger. Too many swings. Try again in ${Math.ceil(Math.max(ttl, 1) / 60)} minutes.`,
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    }
  }

  const challengeLimit = isPractice
    ? RATE_LIMITS.practicePerChallengePerWindow
    : RATE_LIMITS.perChallengePerWindow

  if (challengeCount > challengeLimit) {
    const ttl = await redis.ttl(challengeKey)
    return {
      allowed: false,
      reason: isPractice
        ? `Driving range closed temporarily. Try again in ${ttl > 0 ? ttl : WINDOW_SECONDS}s.`
        : `Hole cooldown active. Try again in ${ttl > 0 ? ttl : WINDOW_SECONDS}s.`,
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    }
  }

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

const IP_ATTEMPTS_TTL_SECONDS = 24 * 60 * 60

function attemptKeys(sessionId: string, challengeId: string, ip: string) {
  return {
    sessionKey: REDIS_KEYS.bestSwing(sessionId, challengeId) + ':attempts',
    ipKey: REDIS_KEYS.bestSwing(`ip:${ip}`, challengeId) + ':attempts',
  }
}

/**
 * Increment the server-side attempt count used for the score penalty.
 *
 * The session id comes from the browser, so a fresh one would reset the
 * count. The count is also kept per IP for a day and the higher one wins.
 */
export async function incrementAttemptCount(
  sessionId: string,
  challengeId: string,
  ip: string
): Promise<number> {
  const redis = getRedisClient()
  const { sessionKey, ipKey } = attemptKeys(sessionId, challengeId, ip)
  const pipeline = redis.pipeline()
  pipeline.incr(sessionKey)
  pipeline.expire(sessionKey, RESULT_TTL_SECONDS)
  pipeline.incr(ipKey)
  pipeline.expire(ipKey, IP_ATTEMPTS_TTL_SECONDS, 'NX')
  const [sessionRaw, , ipRaw] = await pipeline.exec()
  return Math.max(
    (sessionRaw as number | null) ?? 1,
    (ipRaw as number | null) ?? 1
  )
}

/**
 * Get the current attempt count without incrementing (mulligan retries).
 */
export async function getAttemptCount(
  sessionId: string,
  challengeId: string,
  ip: string
): Promise<number> {
  const redis = getRedisClient()
  const { sessionKey, ipKey } = attemptKeys(sessionId, challengeId, ip)
  const [sessionCount, ipCount] = await redis.mget<(number | null)[]>(
    sessionKey,
    ipKey
  )
  return Math.max(sessionCount ?? 0, ipCount ?? 0)
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
