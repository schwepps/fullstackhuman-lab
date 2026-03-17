import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  RATE_LIMIT_GLOBAL_PER_15MIN,
  RATE_LIMIT_PER_LEVEL_PER_15MIN,
  RATE_LIMIT_ADVANCED_PER_15MIN,
  RATE_LIMIT_WINDOW_SECONDS,
  TTL_WIN_SECONDS,
  TOTAL_LEVELS,
} from './constants'

interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
}

/**
 * Check all rate limits before incrementing any counter.
 * This avoids "burning" a user's quota when a later check rejects.
 *
 * Uses unconditional EXPIRE (idempotent) to avoid TOCTOU race
 * where a crash between INCR and EXPIRE leaves a key without TTL.
 */
export async function checkAttemptAllowed(
  ip: string,
  levelId: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  const globalKey = REDIS_KEYS.rateLimitGlobal(ip)
  const levelKey = REDIS_KEYS.rateLimitLevel(ip, levelId)

  // Read all counters first (without incrementing)
  const readPipeline = redis.pipeline()
  readPipeline.get<number>(globalKey)
  readPipeline.get<number>(levelKey)
  const [globalRaw, levelRaw] = await readPipeline.exec()

  const globalCount = (globalRaw as number | null) ?? 0
  const levelCount = (levelRaw as number | null) ?? 0

  // Check global limit
  if (globalCount >= RATE_LIMIT_GLOBAL_PER_15MIN) {
    const ttl = await redis.ttl(globalKey)
    return {
      allowed: false,
      reason: `SYSTEM LOCKOUT: Too many attempts. ${Math.ceil(Math.max(ttl, 1) / 60)}min cooldown.`,
      retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS,
    }
  }

  // Check per-level limit
  const isAdvanced = levelId >= 6
  const levelLimit = isAdvanced
    ? RATE_LIMIT_ADVANCED_PER_15MIN
    : RATE_LIMIT_PER_LEVEL_PER_15MIN

  if (levelCount >= levelLimit) {
    const ttl = await redis.ttl(levelKey)
    return {
      allowed: false,
      reason: `FIREWALL COOLDOWN: Try again in ${ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS}s.`,
      retryAfterSeconds: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_SECONDS,
    }
  }

  // All checks passed — increment all counters and set TTLs (idempotent)
  const incrPipeline = redis.pipeline()
  incrPipeline.incr(globalKey)
  incrPipeline.expire(globalKey, RATE_LIMIT_WINDOW_SECONDS)
  incrPipeline.incr(levelKey)
  incrPipeline.expire(levelKey, RATE_LIMIT_WINDOW_SECONDS)
  await incrPipeline.exec()

  return { allowed: true }
}

export async function incrementBudgetCounter(): Promise<number> {
  const redis = getRedisClient()
  const today = new Date().toISOString().split('T')[0]
  const key = REDIS_KEYS.budgetDaily(today)
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, 172_800) // 48h TTL, idempotent
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
  await redis.set(key, JSON.stringify({ score, timestamp: Date.now() }), {
    ex: TTL_WIN_SECONDS,
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
 * Increment and return the server-side attempt count for a session+level.
 * Used for accurate scoring (prevents sessionId rotation to reset counts).
 */
export async function incrementAttemptCount(
  sessionId: string,
  levelId: number
): Promise<number> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.attemptCount(sessionId, levelId)
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, TTL_WIN_SECONDS) // Same lifespan as wins
  const [countRaw] = await pipeline.exec()
  return (countRaw as number | null) ?? 1
}
