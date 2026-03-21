import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  claimMember,
  releaseMember,
  getClaimedMembers,
} from '@/lib/session-manager'
import { isValidMemberId } from '@/lib/members'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

const claimSchema = z.object({
  memberId: z.string().refine(isValidMemberId, 'Invalid member ID'),
  sessionId: z.string().min(1),
  action: z.enum(['claim', 'release']),
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

  const parsed = claimSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { memberId, sessionId, action } = parsed.data

  if (action === 'claim') {
    const success = await claimMember(memberId, sessionId)
    if (!success) {
      return NextResponse.json(
        { error: 'This member is already taken by another player.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ claimed: true })
  }

  await releaseMember(memberId, sessionId)
  return NextResponse.json({ released: true })
}

export async function GET() {
  const claims = await getClaimedMembers()
  return NextResponse.json({ claims })
}
