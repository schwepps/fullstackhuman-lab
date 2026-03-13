import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { moderateMessage } from '@/lib/game/moderator'

const INTERNAL_TOKEN = process.env.GAME_INTERNAL_TOKEN

const MAX_CONTENT_LENGTH = 500
const MAX_PLAYER_ID_LENGTH = 100

function safeTokenCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(request: Request) {
  // Require token — fail closed if not configured
  if (!INTERNAL_TOKEN) {
    return NextResponse.json(
      { error: 'Moderation not configured' },
      { status: 500 }
    )
  }

  const token = request.headers.get('x-internal-token')
  if (!token || !safeTokenCompare(token, INTERNAL_TOKEN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, playerId } = body

    if (
      typeof content !== 'string' ||
      typeof playerId !== 'string' ||
      content.length > MAX_CONTENT_LENGTH ||
      playerId.length > MAX_PLAYER_ID_LENGTH
    ) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const result = await moderateMessage(content, playerId)
    return NextResponse.json(result)
  } catch {
    // Fail closed — block on error
    return NextResponse.json(
      { safe: false, reason: 'moderation_error' },
      { status: 500 }
    )
  }
}
