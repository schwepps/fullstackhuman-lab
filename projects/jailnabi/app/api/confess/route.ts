import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentRound } from '@/lib/round-manager'
import { addConfession } from '@/lib/record-manager'
import { isValidMemberId } from '@/lib/members'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { getRedisClient } from '@/lib/upstash'
import { REDIS_KEYS, MAX_CONFESSION_LENGTH } from '@/lib/constants'
import type { Confession } from '@/lib/types'

const confessSchema = z.object({
  memberId: z.string().refine(isValidMemberId, 'Invalid member ID'),
  text: z
    .string()
    .trim()
    .min(1, 'Confession cannot be empty')
    .max(MAX_CONFESSION_LENGTH, `Max ${MAX_CONFESSION_LENGTH} characters`),
})

export async function POST(request: Request) {
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

  const parsed = confessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Verify the member is the convict of the current round
  const round = await getCurrentRound()
  if (!round || round.convictId !== parsed.data.memberId) {
    return NextResponse.json(
      { error: 'Only the convicted player can submit a confession.' },
      { status: 403 }
    )
  }

  // Check if already confessed
  const redis = getRedisClient()
  const existing = await redis.get(REDIS_KEYS.roundConfession(round.id))
  if (existing) {
    return NextResponse.json(
      { error: 'You have already confessed for this round.' },
      { status: 409 }
    )
  }

  const confession: Confession = {
    memberId: parsed.data.memberId,
    text: parsed.data.text,
    submittedAt: new Date().toISOString(),
  }

  // Store on round
  await redis.set(
    REDIS_KEYS.roundConfession(round.id),
    JSON.stringify(confession)
  )

  // Add to member's confession history
  await addConfession(parsed.data.memberId, confession)

  return NextResponse.json(confession, { status: 201 })
}
