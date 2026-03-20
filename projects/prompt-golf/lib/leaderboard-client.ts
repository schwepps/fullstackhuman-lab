import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS, RESULT_TTL_SECONDS } from './constants'
import type { LeaderboardEntry } from './types'

const MAX_ENTRIES = 50

/**
 * Submit a course score to the leaderboard.
 * Uses Redis sorted set with total strokes as score (lower = better).
 * Stores metadata in a separate hash key.
 */
export async function submitToLeaderboard(
  entry: LeaderboardEntry
): Promise<void> {
  const redis = getRedisClient()
  const leaderboardKey = REDIS_KEYS.leaderboard(entry.course)
  const metaKey = `${leaderboardKey}:meta:${entry.sessionId}`

  const pipeline = redis.pipeline()
  // Sorted set: lower score = better rank
  pipeline.zadd(leaderboardKey, {
    score: entry.totalStrokes,
    member: entry.sessionId,
  })
  // Store display metadata
  pipeline.set(metaKey, JSON.stringify(entry), { ex: RESULT_TTL_SECONDS })
  await pipeline.exec()
}

/**
 * Get top leaderboard entries for a course.
 * Returns entries sorted by total strokes (ascending = best first).
 */
export async function getLeaderboard(
  course: string,
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const redis = getRedisClient()
  const leaderboardKey = REDIS_KEYS.leaderboard(course)

  // Get top N session IDs by score (ascending)
  const members = await redis.zrange(leaderboardKey, 0, limit - 1)

  if (!members || members.length === 0) return []

  // Fetch metadata for each
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
      if (entry.displayName && entry.totalStrokes != null) {
        entries.push(entry)
      }
    } catch {
      // Skip malformed entries
    }
  }

  return entries.slice(0, MAX_ENTRIES)
}
