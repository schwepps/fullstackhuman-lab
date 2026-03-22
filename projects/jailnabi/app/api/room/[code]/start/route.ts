import { NextResponse } from 'next/server'
import { z } from 'zod'
import { startGame } from '@/lib/room-manager'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'

const startSchema = z.object({
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

  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  try {
    const room = await startGame(code.toUpperCase(), parsed.data.sessionId)
    return NextResponse.json(room)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to start' },
      { status: 400 }
    )
  }
}
