import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS, RESULT_TTL_SECONDS, safeKey } from './constants'
import type { LeaderboardEntry } from './types'

const MAX_ENTRIES = 50

/**
 * Record a hole win and auto-update the leaderboard.
 *
 * Stores the best effective strokes per hole for a session.
 * Recomputes the accumulated total and updates the sorted set.
 * Called automatically after every passing scored swing.
 */
export async function recordHoleAndUpdateLeaderboard(
  sessionId: string,
  course: string,
  challengeId: string,
  effectiveStrokes: number,
  par: number,
  displayName: string
): Promise<void> {
  const redis = getRedisClient()

  // Store best score per hole (lower is better)
  // Use SETNX for first attempt, then compare-and-set for improvements.
  // Note: not fully atomic without Lua, but concurrent requests for
  // the same session+hole are extremely unlikely in practice.
  const holeKey = `${REDIS_KEYS.leaderboard(course)}:hole:${safeKey(sessionId)}:${safeKey(challengeId)}`

  // Try SETNX first (atomic for first-time)
  const wasSet = await redis.set(holeKey, effectiveStrokes, {
    ex: RESULT_TTL_SECONDS,
    nx: true,
  })

  if (!wasSet) {
    // Key exists — only update if better
    const existing = await redis.get<number>(holeKey)
    if (existing != null && existing <= effectiveStrokes) return
    await redis.set(holeKey, effectiveStrokes, { ex: RESULT_TTL_SECONDS })
  }

  // Recompute total from all holes for this session
  // Since we can't SCAN in Upstash REST easily, we store a hole list
  const holesListKey = `${REDIS_KEYS.leaderboard(course)}:holes:${safeKey(sessionId)}`
  await redis.sadd(holesListKey, challengeId)
  await redis.expire(holesListKey, RESULT_TTL_SECONDS)

  // Get all completed hole IDs
  const completedHoles = await redis.smembers(holesListKey)
  if (!completedHoles || completedHoles.length === 0) return

  // Fetch all hole scores
  const scorePipeline = redis.pipeline()
  let totalPar = 0
  for (const holeId of completedHoles) {
    const key = `${REDIS_KEYS.leaderboard(course)}:hole:${safeKey(sessionId)}:${safeKey(String(holeId))}`
    scorePipeline.get<number>(key)
    // Each hole has a par, but we don't have it here — use the passed par
    // for the current hole. For accumulated, we'd need to look up each par.
    // Simplified: assume par is stored per hole too.
  }
  const scores = await scorePipeline.exec()

  let totalStrokes = 0
  for (const raw of scores) {
    const s = raw as number | null
    if (s != null) totalStrokes += s
  }

  // For total par, we store it alongside
  const totalParKey = `${REDIS_KEYS.leaderboard(course)}:totalpar:${safeKey(sessionId)}`
  // Increment par tracking: add this hole's par if first time (wasSet = true)
  if (wasSet) {
    // First time completing this hole
    await redis.incrby(totalParKey, par)
    await redis.expire(totalParKey, RESULT_TTL_SECONDS)
  }
  totalPar = (await redis.get<number>(totalParKey)) ?? par

  const entry: LeaderboardEntry = {
    displayName: displayName || 'Anonymous',
    sessionId,
    course,
    totalStrokes,
    totalPar,
    relativeScore: totalStrokes - totalPar,
    holesCompleted: completedHoles.length,
    completedAt: new Date().toISOString(),
  }

  // Update sorted set + metadata
  const leaderboardKey = REDIS_KEYS.leaderboard(course)
  const metaKey = `${leaderboardKey}:meta:${safeKey(sessionId)}`

  const updatePipeline = redis.pipeline()
  updatePipeline.zadd(leaderboardKey, {
    score: totalStrokes,
    member: sessionId,
  })
  updatePipeline.set(metaKey, JSON.stringify(entry), {
    ex: RESULT_TTL_SECONDS,
  })
  await updatePipeline.exec()
}

/**
 * Get top leaderboard entries for a course.
 */
export async function getLeaderboard(
  course: string,
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const redis = getRedisClient()
  const leaderboardKey = REDIS_KEYS.leaderboard(course)

  const members = await redis.zrange(leaderboardKey, 0, limit - 1)

  if (!members || members.length === 0) return []

  const pipeline = redis.pipeline()
  for (const sessionId of members) {
    pipeline.get<string>(`${leaderboardKey}:meta:${sessionId}`)
  }
  const results = await pipeline.exec()

  const entries: LeaderboardEntry[] = []
  for (const raw of results) {
    if (!raw) continue
    try {
      const entry =
        typeof raw === 'string'
          ? (JSON.parse(raw) as LeaderboardEntry)
          : (raw as LeaderboardEntry)
      if (entry.totalStrokes != null) {
        entries.push(entry)
      }
    } catch {
      // Skip malformed entries
    }
  }

  return entries.slice(0, MAX_ENTRIES)
}
