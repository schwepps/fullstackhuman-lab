import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRoom, getPlayers, storeVote } from '@/lib/room-manager'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

const voteSchema = z.object({
  sessionId: z.string().min(1),
  votedForSessionId: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const upperCode = code.toUpperCase()

  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { sessionId, votedForSessionId } = parsed.data

  // Can't vote for yourself
  if (sessionId === votedForSessionId) {
    return NextResponse.json(
      { error: "You can't vote for yourself." },
      { status: 400 }
    )
  }

  const room = await getRoom(upperCode)
  if (!room || room.status !== 'playing') {
    return NextResponse.json(
      { error: 'Game not in progress.' },
      { status: 400 }
    )
  }

  const players = await getPlayers(upperCode)
  const isPlayer = players.some((p) => p.sessionId === sessionId)
  const targetExists = players.some((p) => p.sessionId === votedForSessionId)

  if (!isPlayer || !targetExists) {
    return NextResponse.json({ error: 'Invalid vote.' }, { status: 400 })
  }

  await storeVote(upperCode, room.currentRound, sessionId, votedForSessionId)

  return NextResponse.json({ voted: true })
}
