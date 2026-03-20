import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getCurrentRound,
  advancePhase,
  getRoundEvidence,
} from '@/lib/round-manager'
import { isValidMemberId } from '@/lib/members'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { MIN_EVIDENCE_FOR_COURT } from '@/lib/constants'

const advanceSchema = z.object({
  calledBy: z.string().refine(isValidMemberId, 'Invalid member ID'),
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

  const parsed = advanceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const round = await getCurrentRound()
  if (!round) {
    return NextResponse.json({ error: 'No active round.' }, { status: 404 })
  }

  // Validate transition requirements
  if (round.phase === 'prosecution') {
    const evidence = await getRoundEvidence(round.id)
    if (evidence.length < MIN_EVIDENCE_FOR_COURT) {
      return NextResponse.json(
        {
          error: `Need at least ${MIN_EVIDENCE_FOR_COURT} pieces of evidence to call the court.`,
        },
        { status: 400 }
      )
    }
  }

  try {
    const updated = await advancePhase(round.id)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to advance phase' },
      { status: 400 }
    )
  }
}
