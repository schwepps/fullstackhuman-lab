import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createRoom } from '@/lib/room-manager'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import {
  MIN_CRIME_LENGTH,
  MAX_CRIME_LENGTH,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
} from '@/lib/constants'

const createSchema = z.object({
  creatorName: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  sessionId: z.string().min(1),
  crime: z
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
  initialAccusation: z
    .string()
    .trim()
    .min(1, 'Initial accusation is required')
    .max(MAX_CRIME_LENGTH),
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

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const room = await createRoom(
    parsed.data.creatorName,
    parsed.data.sessionId,
    parsed.data.crime,
    parsed.data.initialAccusation
  )

  return NextResponse.json(room, { status: 201 })
}
