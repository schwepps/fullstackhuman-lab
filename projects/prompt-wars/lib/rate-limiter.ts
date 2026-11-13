import 'server-only'
import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  RATE_LIMIT_GLOBAL_PER_15MIN,
  RATE_LIMIT_PER_LEVEL_PER_15MIN,
  RATE_LIMIT_ADVANCED_PER_15MIN,
  RATE_LIMIT_WINDOW_SECONDS,
  TTL_WIN_SECONDS,
  TTL_IP_ATTEMPTS_SECONDS,
  TOTAL_LEVELS,
} from './constants'

interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
}

/**
 * Count this attempt, then compare against the limits.
 *
 * Incrementing first makes the check atomic: parallel requests cannot all
 * read the same count and pass. EXPIRE NX starts the window once, so a
 * steady trickle of requests cannot keep pushing the reset time back.
 */
export async function checkAttemptAllowed(
  ip: string,
  levelId: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  const globalKey = REDIS_KEYS.rateLimitGlobal(ip)
  const levelKey = REDIS_KEYS.rateLimitLevel(ip, levelId)

  const pipeline = redis.pipeline()
  pipeline.incr(globalKey)
  pipeline.expire(globalKey, RATE_LIMIT_WINDOW_SECONDS, 'NX')
  pipeline.incr(levelKey)
  pipeline.expire(levelKey, RATE_LIMIT_WINDOW_SECONDS, 'NX')
  const [globalRaw, , levelRaw] = await pipeline.exec()

  const globalCount = (globalRaw as number | null) ?? 0
  const levelCount = (levelRaw as number | null) ?? 0

  if (globalCount > RATE_LIMIT_GLOBAL_PER_15MIN) {
    const ttl = await redis.ttl(globalKey)
    return {
      allowed: false,
      reason: `SYSTEM LOCKOUT: Too many attempts. ${Math.ceil(Math.max(ttl, 1) / 60)}min cooldown.`,
      retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS,
    }
  }

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
  const key = REDIS_KEYS.budgetDaily(today)
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, 172_800) // 48h TTL, idempotent
  pipeline.incr(REDIS_KEYS.statsTotal) // Persistent total (no TTL)
  const [countRaw] = await pipeline.exec()
  return (countRaw as number | null) ?? 1
}

export async function getDailyBudget(): Promise<number> {
  const redis = getRedisClient()
  const today = new Date().toISOString().split('T')[0]
  const key = REDIS_KEYS.budgetDaily(today)
  const count = await redis.get<number>(key)
  return count ?? 0
}

/**
 * Get the all-time total attempt count (persistent counter).
 */
export async function getTotalAttemptCount(): Promise<number> {
  const redis = getRedisClient()
  const count = await redis.get<number>(REDIS_KEYS.statsTotal)
  return count ?? 0
}

/**
 * Record a verified level win server-side.
 * Used for leaderboard score verification.
 */
export async function recordLevelWin(
  sessionId: string,
  levelId: number,
  score: number
): Promise<void> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.levelWin(sessionId, levelId)

  // First breach is final — NX ensures atomic set-if-not-exists
  await redis.set(key, JSON.stringify({ score, timestamp: Date.now() }), {
    ex: TTL_WIN_SECONDS,
    nx: true,
  })
}

/**
 * Retrieve all verified wins for a session.
 * Returns a map of levelId -> score.
 */
export async function getVerifiedWins(
  sessionId: string
): Promise<Map<number, number>> {
  const redis = getRedisClient()
  const wins = new Map<number, number>()

  const pipeline = redis.pipeline()
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    pipeline.get<string>(REDIS_KEYS.levelWin(sessionId, i))
  }
  const results = await pipeline.exec()

  for (let i = 0; i < results.length; i++) {
    const raw = results[i] as string | null
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        wins.set(i + 1, parsed.score)
      } catch {
        // Skip malformed entries
      }
    }
  }

  return wins
}

/**
 * Get total attempts across all levels for a session.
 */
export async function getTotalAttempts(sessionId: string): Promise<number> {
  const redis = getRedisClient()
  const pipeline = redis.pipeline()
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    pipeline.get<number>(REDIS_KEYS.attemptCount(sessionId, i))
  }
  const results = await pipeline.exec()
  return results.reduce<number>(
    (sum, raw) => sum + ((raw as number | null) ?? 0),
    0
  )
}

/**
 * Increment and return the server-side attempt count for a level.
 *
 * The session id comes from the browser, so a fresh one would reset the
 * count. The count is also kept per IP for a day and the higher one wins.
 */
export async function incrementAttemptCount(
  sessionId: string,
  levelId: number,
  ip: string
): Promise<number> {
  const redis = getRedisClient()
  const sessionKey = REDIS_KEYS.attemptCount(sessionId, levelId)
  const ipKey = REDIS_KEYS.attemptCount(`ip:${ip}`, levelId)
  const pipeline = redis.pipeline()
  pipeline.incr(sessionKey)
  pipeline.expire(sessionKey, TTL_WIN_SECONDS) // Same lifespan as wins
  pipeline.incr(ipKey)
  pipeline.expire(ipKey, TTL_IP_ATTEMPTS_SECONDS, 'NX')
  const [sessionRaw, , ipRaw] = await pipeline.exec()
  return Math.max(
    (sessionRaw as number | null) ?? 1,
    (ipRaw as number | null) ?? 1
  )
}
