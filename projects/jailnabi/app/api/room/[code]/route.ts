import { NextResponse } from 'next/server'
import {
  getRoom,
  getPlayers,
  getRoundMessages,
  getRoundVotes,
  getScores,
  getVerdict,
  getTip,
} from '@/lib/room-manager'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { AI_SKILLS } from '@/lib/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  // Rate limit GET requests (6+ Redis calls per request)
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const { code } = await params

  const room = await getRoom(code.toUpperCase())
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const players = await getPlayers(room.code)
  const currentRoundMessages =
    room.currentRound > 0
      ? await getRoundMessages(room.code, room.currentRound)
      : []
  const currentRoundVotes =
    room.currentRound > 0
      ? await getRoundVotes(room.code, room.currentRound)
      : {}
  const scores = await getScores(room.code)
  const verdict = await getVerdict(room.code)
  const aiTip = await getTip(room.code)
  const skill = AI_SKILLS.find((s) => s.id === room.skillId) ?? null

  // Strip sessionIds from response — don't expose to clients
  const safeRoom = {
    ...room,
    creatorSessionId: undefined,
  }
  const safePlayers = players.map(({ name, joinedAt }) => ({ name, joinedAt }))
  const safeMessages = currentRoundMessages.map(
    ({ playerName, generatedContent, targetName, isDefense, wordCount }) => ({
      playerName,
      generatedContent,
      targetName,
      isDefense,
      wordCount,
    })
  )

  return NextResponse.json({
    room: safeRoom,
    players: safePlayers,
    currentRoundMessages: safeMessages,
    currentRoundVotes,
    scores,
    verdict,
    aiTip,
    skill,
  })
}
