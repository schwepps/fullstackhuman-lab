import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getRedisClient } from '@/lib/upstash'
import { REDIS_KEYS, TTL_WIN_SECONDS } from '@/lib/constants'
import { getVerifiedWins, getTotalAttempts } from '@/lib/rate-limiter'
import type { LeaderboardEntry } from '@/lib/types'

const MAX_ENTRIES = 50

const submitSchema = z.object({
  sessionId: z.string().uuid(),
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[\w\s\-_.!?]+$/, 'Display name contains invalid characters'),
})

export async function GET() {
  try {
    const redis = getRedisClient()

    // Get top entries from sorted set (highest score first)
    const raw = await redis.zrange(REDIS_KEYS.leaderboard, 0, MAX_ENTRIES - 1, {
      rev: true,
      withScores: true,
    })

    // Parse entries: zrange returns [member, score, member, score, ...]
    const entries: LeaderboardEntry[] = []
    for (let i = 0; i < raw.length; i += 2) {
      const memberStr = raw[i] as string
      const score = raw[i + 1] as number
      try {
        const member =
          typeof memberStr === 'string' ? JSON.parse(memberStr) : memberStr
        entries.push({
          rank: Math.floor(i / 2) + 1,
          displayName: member.displayName ?? 'Anonymous',
          levelsCompleted: member.levelsCompleted ?? 0,
          totalAttempts: member.totalAttempts ?? 0,
          totalScore: score,
          completedAt: member.completedAt ?? '',
        })
      } catch {
        // Skip malformed entries
      }
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
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { sessionId, displayName } = parsed.data

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

    // Remove any previous entry for this session (by sessionId index)
    const existingMember = await redis.get<string>(
      `${REDIS_KEYS.leaderboard}:idx:${sessionId}`
    )
    if (existingMember) {
      await redis.zrem(REDIS_KEYS.leaderboard, existingMember)
    }

    // Add new entry (no sessionId in member — use index for dedup)
    const member = JSON.stringify({
      displayName,
      levelsCompleted,
      totalAttempts,
      completedAt: new Date().toISOString(),
    })
    await redis.zadd(REDIS_KEYS.leaderboard, { score: totalScore, member })

    // Store index for deduplication
    await redis.set(`${REDIS_KEYS.leaderboard}:idx:${sessionId}`, member, {
      ex: TTL_WIN_SECONDS,
    })

    return Response.json({ success: true, totalScore, levelsCompleted })
  } catch (error) {
    console.error('Leaderboard submit error:', error)
    return Response.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
