import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getCurrentRound,
  startRound,
  getRoundEvidence,
  getRoundDefenses,
} from '@/lib/round-manager'
import { getCrime } from '@/lib/crime-pool'
import { isValidMemberId } from '@/lib/members'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { getSkillForRound } from '@/lib/techniques'
import { getRedisClient } from '@/lib/upstash'
import { REDIS_KEYS } from '@/lib/constants'

const startSchema = z.object({
  crimeId: z.string().min(1),
  startedBy: z.string().refine(isValidMemberId, 'Invalid member ID'),
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

  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  // Look up crime text from Redis — server is source of truth
  const crime = await getCrime(parsed.data.crimeId)
  if (!crime) {
    return NextResponse.json({ error: 'Crime not found' }, { status: 404 })
  }
  if (crime.used) {
    return NextResponse.json(
      { error: 'This crime has already been used' },
      { status: 400 }
    )
  }

  try {
    const round = await startRound(crime.id, crime.text)
    return NextResponse.json(round, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to start round' },
      { status: 409 }
    )
  }
}

export async function GET() {
  const round = await getCurrentRound()
  if (!round) {
    return NextResponse.json({
      round: null,
      evidence: [],
      defenses: {},
      skill: null,
    })
  }

  const [evidence, defenses] = await Promise.all([
    getRoundEvidence(round.id),
    getRoundDefenses(round.id),
  ])

  const skill = getSkillForRound(round.skillIndex)

  // Check if verdict exists
  const redis = getRedisClient()
  const verdictRaw = await redis.get(REDIS_KEYS.roundVerdict(round.id))
  const verdict = verdictRaw
    ? typeof verdictRaw === 'string'
      ? JSON.parse(verdictRaw)
      : verdictRaw
    : null

  return NextResponse.json({ round, evidence, defenses, skill, verdict })
}
