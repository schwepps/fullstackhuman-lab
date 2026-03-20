import { NextRequest } from 'next/server'
import { getLeaderboard } from '@/lib/leaderboard-client'

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
