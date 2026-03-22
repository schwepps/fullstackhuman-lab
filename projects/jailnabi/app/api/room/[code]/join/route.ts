import { NextResponse } from 'next/server'
import { z } from 'zod'
import { joinRoom } from '@/lib/room-manager'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { MIN_NAME_LENGTH, MAX_NAME_LENGTH } from '@/lib/constants'

const joinSchema = z.object({
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  sessionId: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

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

  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  try {
    const player = await joinRoom(
      code.toUpperCase(),
      parsed.data.name,
      parsed.data.sessionId
    )
    return NextResponse.json(player, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to join' },
      { status: 400 }
    )
  }
}
