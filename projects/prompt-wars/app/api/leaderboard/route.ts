import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getRedisClient } from '@/lib/upstash'
import { REDIS_PREFIX } from '@/lib/constants'
import type { LeaderboardEntry } from '@/lib/types'

const LEADERBOARD_KEY = `${REDIS_PREFIX}leaderboard`
const MAX_ENTRIES = 50

const submitSchema = z.object({
  sessionId: z.string().min(1),
  displayName: z.string().trim().min(1).max(30),
  levelsCompleted: z.number().int().min(1).max(7),
  totalAttempts: z.number().int().min(1),
  totalScore: z.number().int().min(0),
})

export async function GET() {
  try {
    const redis = getRedisClient()

    // Get top entries from sorted set (highest score first)
    const raw = await redis.zrange(LEADERBOARD_KEY, 0, MAX_ENTRIES - 1, {
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

  const { sessionId, displayName, levelsCompleted, totalAttempts, totalScore } =
    parsed.data

  try {
    const redis = getRedisClient()

    // Remove any previous entry for this session
    const existingEntries = await redis.zrange(LEADERBOARD_KEY, 0, -1)
    for (const entry of existingEntries) {
      const entryStr = typeof entry === 'string' ? entry : JSON.stringify(entry)
      try {
        const parsed = JSON.parse(entryStr)
        if (parsed.sessionId === sessionId) {
          await redis.zrem(LEADERBOARD_KEY, entryStr)
        }
      } catch {
        // Skip
      }
    }

    // Add new entry
    const member = JSON.stringify({
      sessionId,
      displayName,
      levelsCompleted,
      totalAttempts,
      completedAt: new Date().toISOString(),
    })
    await redis.zadd(LEADERBOARD_KEY, { score: totalScore, member })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Leaderboard submit error:', error)
    return Response.json({ error: 'Failed to submit score' }, { status: 500 })
  }
}
