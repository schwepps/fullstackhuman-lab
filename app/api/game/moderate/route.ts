import { NextResponse } from 'next/server'
import { moderateMessage } from '@/lib/game/moderator'

export async function POST(request: Request) {
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
