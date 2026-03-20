import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getLeaderboard, submitToLeaderboard } from '@/lib/leaderboard-client'
import type { LeaderboardEntry } from '@/lib/types'

const submitSchema = z.object({
  displayName: z.string().trim().min(1).max(30),
  sessionId: z.string().uuid(),
  course: z.string().regex(/^[a-z0-9-]+$/),
  totalStrokes: z.number().int().min(0),
  totalPar: z.number().int().min(1),
  relativeScore: z.number(),
  holesCompleted: z.number().int().min(1).max(18),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const course = searchParams.get('course') ?? 'front-9'

  if (!/^[a-z0-9-]+$/.test(course)) {
    return Response.json({ error: 'Invalid course.' }, { status: 400 })
  }

  try {
    const entries = await getLeaderboard(course)
    return Response.json({ entries })
  } catch (error) {
    console.error('[leaderboard] GET failed:', error)
    return Response.json(
      { error: 'Failed to load leaderboard.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let body: z.infer<typeof submitSchema>
  try {
    const raw = await request.json()
    body = submitSchema.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid submission.' }, { status: 400 })
  }

  const entry: LeaderboardEntry = {
    ...body,
    completedAt: new Date().toISOString(),
  }

  try {
    await submitToLeaderboard(entry)
    return Response.json({ success: true })
  } catch (error) {
    console.error('[leaderboard] POST failed:', error)
    return Response.json({ error: 'Failed to submit score.' }, { status: 500 })
  }
}
