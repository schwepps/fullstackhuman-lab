import { NextRequest } from 'next/server'
import { z } from 'zod'
import { sanitizeInput, checkInputSafety } from '@/lib/security'
import { checkEvalRateAllowed } from '@/lib/rate-limiter'
import { createEvaluationStream } from '@/lib/evaluator'
import { situationSchema } from '@/lib/validation'
import { MIN_SITUATION_LENGTH } from '@/lib/constants'
import type { SSEEvent } from '@/lib/types'

const requestSchema = z.object({
  situation: situationSchema,
})

const IP_PATTERN = /^[\da-fA-F.:]+$/

/**
 * Extract client IP, preferring Vercel's trusted header.
 * Validates format to prevent Redis key injection.
 */
function getClientIP(request: NextRequest): string {
  const raw =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // Validate IP format to prevent Redis key injection
  if (IP_PATTERN.test(raw) && raw.length < 46) return raw
  return 'invalid'
}

function formatSSE(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
}

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Validate input ────────────────────────────────────────────
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const situation = sanitizeInput(parsed.data.situation)

  // Re-validate after sanitization (stripping control chars may shorten it)
  if (situation.length < MIN_SITUATION_LENGTH) {
    return Response.json(
      { error: 'Input too short after cleanup. Add more detail.' },
      { status: 400 }
    )
  }

  // ── Rate limit (fail closed) ──────────────────────────────────
  const ip = getClientIP(request)

  try {
    const rateCheck = await checkEvalRateAllowed(ip)
    if (!rateCheck.allowed) {
      return Response.json({ error: rateCheck.reason }, { status: 429 })
    }
  } catch (error) {
    console.error('Rate limiting unavailable:', error)
    return Response.json(
      { error: 'Service temporarily unavailable. Try again in a moment.' },
      { status: 503 }
    )
  }

  // ── Security check ────────────────────────────────────────────
  const safety = await checkInputSafety(situation)
  if (!safety.safe) {
    const messages: Record<string, string> = {
      blocked: "This content can't be processed.",
      injection:
        'Nice try! But this app is for describing workplace chaos, not hacking AI.',
      offtopic:
        "This doesn't sound like a workplace situation. Try describing your actual job chaos!",
    }
    return Response.json(
      { error: messages[safety.reason] ?? 'Input rejected.' },
      { status: 422 }
    )
  }

  // ── Stream evaluation ─────────────────────────────────────────
  const evaluationStream = createEvaluationStream(situation)

  // Transform SSEEvent objects to SSE-formatted text
  const textEncoder = new TextEncoder()
  const sseStream = evaluationStream.pipeThrough(
    new TransformStream<SSEEvent, Uint8Array>({
      transform(event, controller) {
        controller.enqueue(textEncoder.encode(formatSSE(event)))
      },
    })
  )

  return new Response(sseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
