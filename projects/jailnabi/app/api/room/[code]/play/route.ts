import { z } from 'zod'
import {
  getRoom,
  getPlayers,
  storeMessage,
  getRoundMessages,
} from '@/lib/room-manager'
import { generateContent } from '@/lib/evidence-generator'
import { validatePrompt } from '@/lib/anti-gaming'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { countWords } from '@/lib/word-counter'
import { AI_SKILLS } from '@/lib/constants'
import type { RoundMessage } from '@/lib/types'

const playSchema = z.object({
  sessionId: z.string().min(1),
  prompt: z.string().min(1),
  targetName: z.string().nullable(),
  isDefense: z.boolean(),
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
    return sseError('Too many requests.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return sseError('Invalid JSON body', 400)
  }

  const parsed = playSchema.safeParse(body)
  if (!parsed.success) {
    return sseError(parsed.error.issues[0].message, 400)
  }

  const { sessionId, prompt, targetName, isDefense } = parsed.data

  const room = await getRoom(upperCode)
  if (!room || room.status !== 'playing') {
    return sseError('Game is not in progress.', 400)
  }

  const players = await getPlayers(upperCode)
  const player = players.find((p) => p.sessionId === sessionId)
  if (!player) {
    return sseError('You are not in this room.', 403)
  }

  // Check if already submitted this round
  const existing = await getRoundMessages(upperCode, room.currentRound)
  if (existing.some((m) => m.sessionId === sessionId)) {
    return sseError('You already submitted for this round.', 400)
  }

  const validation = validatePrompt(prompt)
  if (!validation.isValid) {
    return sseError(validation.reason ?? 'Invalid prompt', 400)
  }

  const skill = AI_SKILLS.find((s) => s.id === room.skillId) ?? AI_SKILLS[0]
  const accusedPlayer =
    room.initialAccusedIndex !== null ? players[room.initialAccusedIndex] : null

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `event: stage_update\ndata: ${JSON.stringify({ stage: 'generating', status: 'processing' })}\n\n`
          )
        )

        const generatedContent = await generateContent(
          prompt,
          player.name,
          room.crime,
          skill,
          {
            targetName,
            isDefense,
            accusedName: accusedPlayer?.name ?? 'Unknown',
          },
          (token) => {
            controller.enqueue(
              encoder.encode(
                `event: token\ndata: ${JSON.stringify({ text: token })}\n\n`
              )
            )
          }
        )

        const message: RoundMessage = {
          playerName: player.name,
          sessionId,
          prompt,
          generatedContent,
          targetName,
          isDefense,
          wordCount: countWords(prompt),
        }

        await storeMessage(upperCode, room.currentRound, message)

        controller.enqueue(
          encoder.encode(
            `event: complete\ndata: ${JSON.stringify({ message })}\n\n`
          )
        )
      } catch {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: 'Evidence generation failed. Please try again.' })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

function sseError(message: string, status: number) {
  return new Response(
    `event: error\ndata: ${JSON.stringify({ message })}\n\n`,
    { status, headers: sseHeaders() }
  )
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  }
}
