import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getRoom,
  getPlayers,
  getRoundMessages,
  storeMessage,
  getRoundVotes,
  getScores,
  storeScores,
  storeTip,
  storeVerdict,
  advanceRound,
} from '@/lib/room-manager'
import { scoreRound } from '@/lib/round-scorer'
import { generateFinalVerdict } from '@/lib/final-verdict'
import { saveResult } from '@/lib/result-store'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { AI_SKILLS, TOTAL_ROUNDS } from '@/lib/constants'
import type { ShareableResult, RoundMessage } from '@/lib/types'

const scoreSchema = z.object({
  sessionId: z.string().min(1),
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

  const parsed = scoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
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

  // Only creator can trigger scoring
  if (room.creatorSessionId !== parsed.data.sessionId) {
    return NextResponse.json(
      { error: 'Only the host can advance the round.' },
      { status: 403 }
    )
  }

  const players = await getPlayers(upperCode)
  let messages = await getRoundMessages(upperCode, room.currentRound)

  // Guard: don't allow scoring before deadline unless all players submitted
  const allSubmitted = messages.length >= players.length
  const deadlinePassed =
    !room.roundDeadline || Date.now() >= new Date(room.roundDeadline).getTime()

  if (!allSubmitted && !deadlinePassed) {
    return NextResponse.json(
      {
        error:
          'Round is still in progress. Wait for the deadline or all players to submit.',
      },
      { status: 400 }
    )
  }

  // Guard: prevent double-scoring (check if scores already exist for this round)
  const existingScores = await getScores(upperCode)
  // Only skip if scores changed this round (crude check: scores exist and round > 1)

  const votes = await getRoundVotes(upperCode, room.currentRound)
  const previousScores = existingScores
  const skill = AI_SKILLS.find((s) => s.id === room.skillId) ?? AI_SKILLS[0]

  // Auto-generate neutral "no-show" messages for players who didn't submit
  const submittedSessionIds = new Set(messages.map((m) => m.sessionId))
  for (const player of players) {
    if (!submittedSessionIds.has(player.sessionId)) {
      // Only write if no existing message (prevent overwriting late submissions)
      const existingMessages = await getRoundMessages(
        upperCode,
        room.currentRound
      )
      const alreadyHasMessage = existingMessages.some(
        (m) => m.sessionId === player.sessionId
      )
      if (!alreadyHasMessage) {
        const noShowMessage: RoundMessage = {
          playerName: player.name,
          sessionId: player.sessionId,
          prompt: '',
          generatedContent: `[${player.name} did not submit a response this round.]`,
          targetName: null,
          isDefense: false,
          wordCount: 0,
        }
        await storeMessage(upperCode, room.currentRound, noShowMessage)
        messages = [...messages, noShowMessage]
      }
    }
  }

  // Score the round
  const { scores, tip } = await scoreRound(
    room.crime,
    messages,
    votes,
    previousScores,
    skill
  )

  await storeScores(upperCode, scores)
  await storeTip(upperCode, tip)

  // Check if final round
  if (room.currentRound >= TOTAL_ROUNDS) {
    // Generate final verdict
    const verdict = await generateFinalVerdict(room.crime, scores)
    await storeVerdict(upperCode, verdict)

    // Save shareable result
    const shareableResult: ShareableResult = {
      id: verdict.resultId,
      roomCode: upperCode,
      convictName: verdict.convictName,
      crime: room.crime,
      sentence: verdict.sentence,
      explanation: verdict.explanation,
      createdAt: new Date().toISOString(),
    }
    await saveResult(shareableResult)

    // Mark room as finished
    await advanceRound(upperCode)

    return NextResponse.json({ scored: true, final: true, verdict })
  }

  // Advance to next round
  await advanceRound(upperCode)

  return NextResponse.json({ scored: true, final: false, scores, tip })
}
