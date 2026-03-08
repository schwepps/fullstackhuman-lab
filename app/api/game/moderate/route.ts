import { NextResponse } from 'next/server'
import { moderateMessage } from '@/lib/game/moderator'

const INTERNAL_TOKEN = process.env.GAME_INTERNAL_TOKEN

export async function POST(request: Request) {
  // Verify internal caller
  if (INTERNAL_TOKEN) {
    const token = request.headers.get('x-internal-token')
    if (token !== INTERNAL_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const { content, playerId } = body

    if (typeof content !== 'string' || typeof playerId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const result = await moderateMessage(content, playerId)
    return NextResponse.json(result)
  } catch {
    // Fail open
    return NextResponse.json({ safe: true })
  }
}
