import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitCrime, getAvailableCrimes } from '@/lib/crime-pool'
import { isValidMemberId } from '@/lib/members'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { MIN_CRIME_LENGTH, MAX_CRIME_LENGTH } from '@/lib/constants'

const submitSchema = z.object({
  text: z
    .string()
    .trim()
    .min(
      MIN_CRIME_LENGTH,
      `Crime must be at least ${MIN_CRIME_LENGTH} characters`
    )
    .max(
      MAX_CRIME_LENGTH,
      `Crime must be at most ${MAX_CRIME_LENGTH} characters`
    ),
  submittedBy: z.string().refine(isValidMemberId, 'Invalid member ID'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const crime = await submitCrime(parsed.data.text, parsed.data.submittedBy)
  return NextResponse.json(crime, { status: 201 })
}

export async function GET() {
  const crimes = await getAvailableCrimes()
  return NextResponse.json(crimes)
}
