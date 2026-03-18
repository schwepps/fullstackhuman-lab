import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getRedisClient } from '@/lib/upstash'
import {
  REDIS_KEYS,
  RATE_LIMIT_WINDOW_SECONDS,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_PATTERN,
} from '@/lib/constants'
import { getVerifiedWins, getTotalAttempts } from '@/lib/rate-limiter'
import type { LeaderboardEntry } from '@/lib/types'

const MAX_ENTRIES = 50
const LEADERBOARD_SUBMIT_LIMIT = 5

const submitSchema = z.object({
  sessionId: z.string().uuid(),
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(DISPLAY_NAME_MAX_LENGTH)
    .regex(DISPLAY_NAME_PATTERN, 'Display name contains invalid characters'),
})

interface LeaderboardMeta {
  displayName: string
  levelsCompleted: number
  totalAttempts: number
  completedAt: string
}

/**
 * Leaderboard storage strategy:
 * - Sorted set (REDIS_KEYS.leaderboard): member = sessionId, score = totalScore
 * - Key per entry (leaderboard:data:<sessionId>): metadata (displayName, etc.)
 *
 * Using sessionId as the sorted set member guarantees deduplication —
 * ZADD with an existing member overwrites the score atomically.
 * Metadata has no TTL — it lives as long as the sorted set entry.
 */

export async function GET() {
  try {
    const redis = getRedisClient()

    // Get top session IDs from sorted set (highest score first)
    const raw = await redis.zrange(REDIS_KEYS.leaderboard, 0, MAX_ENTRIES - 1, {
      rev: true,
      withScores: true,
    })

    // raw is [sessionId, score, sessionId, score, ...]
    // Batch-fetch all metadata in a single pipeline (avoid N+1)
    const sessionIds: string[] = []
    const scores: number[] = []
    for (let i = 0; i < raw.length; i += 2) {
      sessionIds.push(raw[i] as string)
      scores.push(raw[i + 1] as number)
    }

    const metaPipeline = redis.pipeline()
    for (const sid of sessionIds) {
      metaPipeline.get(`${REDIS_KEYS.leaderboard}:data:${sid}`)
    }
    const metaResults = await metaPipeline.exec()

    const entries: LeaderboardEntry[] = []
    for (let i = 0; i < sessionIds.length; i++) {
      const meta = metaResults[i] as LeaderboardMeta | null
      if (!meta) {
        // Self-healing: remove orphaned sorted set entries with no metadata
        await redis.zrem(REDIS_KEYS.leaderboard, sessionIds[i])
        continue
      }
      entries.push({
        rank: entries.length + 1,
        displayName: meta.displayName ?? 'Anonymous',
        levelsCompleted: meta.levelsCompleted ?? 0,
        totalAttempts: meta.totalAttempts ?? 0,
        totalScore: scores[i],
        completedAt: meta.completedAt ?? '',
      })
    }

    return Response.json({ entries })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return Response.json({ entries: [] })
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { sessionId, displayName } = parsed.data

  // Rate limit leaderboard submissions per session
  try {
    const redis = getRedisClient()
    const rateLimitKey = `${REDIS_KEYS.leaderboard}:ratelimit:${sessionId}`
    const count = (await redis.get<number>(rateLimitKey)) ?? 0
    if (count >= LEADERBOARD_SUBMIT_LIMIT) {
      return Response.json(
        { error: 'Too many submissions. Try again later.' },
        { status: 429 }
      )
    }
    const pipeline = redis.pipeline()
    pipeline.incr(rateLimitKey)
    pipeline.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS)
    await pipeline.exec()
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      )
    }
  }

  try {
    // Verify wins server-side — compute real score from stored win records
    const wins = await getVerifiedWins(sessionId)
    if (wins.size === 0) {
      return Response.json(
        { error: 'No verified wins found for this session.' },
        { status: 403 }
      )
    }

    const levelsCompleted = wins.size
    const totalScore = Array.from(wins.values()).reduce(
      (sum, score) => sum + score,
      0
    )
    const totalAttempts = await getTotalAttempts(sessionId)

    const redis = getRedisClient()

    // ZADD with sessionId as member — overwrites score if entry already exists
    await redis.zadd(REDIS_KEYS.leaderboard, {
      score: totalScore,
      member: sessionId,
    })

    // Store metadata (no TTL — lives as long as sorted set entry)
    await redis.set(`${REDIS_KEYS.leaderboard}:data:${sessionId}`, {
      displayName,
      levelsCompleted,
      totalAttempts,
      completedAt: new Date().toISOString(),
    })

    return Response.json({ success: true, totalScore, levelsCompleted })
  } catch (error) {
    console.error('Leaderboard submit error:', error)
    return Response.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
