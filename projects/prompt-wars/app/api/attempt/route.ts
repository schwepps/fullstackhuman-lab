import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getLevel } from '@/lib/levels'
import { runDefensePipeline } from '@/lib/defense-engine'
import {
  checkAttemptAllowed,
  incrementBudgetCounter,
  getDailyBudget,
} from '@/lib/rate-limiter'
import { calculateScore } from '@/lib/scoring'
import type { SSEEvent, AttemptResult } from '@/lib/types'
import {
  BUDGET_WARN_THRESHOLD,
  BUDGET_SHUTDOWN_THRESHOLD,
  TOTAL_LEVELS,
} from '@/lib/constants'

const requestSchema = z.object({
  levelId: z.number().int().min(1).max(TOTAL_LEVELS),
  prompt: z.string().trim().min(1),
  sessionId: z.string().min(1),
})

const IP_PATTERN = /^[\da-fA-F.:]+$/

function getClientIP(request: NextRequest): string {
  const raw =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  if (IP_PATTERN.test(raw) && raw.length < 46) return raw
  return 'invalid'
}

function formatSSE(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
}

export async function POST(request: NextRequest) {
  // ── Kill switch ─────────────────────────────────────────────────
  if (process.env.DISABLE_API_CALLS === 'true') {
    return Response.json(
      { error: 'SYSTEM MAINTENANCE — BACK SOON' },
      { status: 503 }
    )
  }

  // ── Parse body ──────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { levelId, prompt } = parsed.data

  // ── Get level config ────────────────────────────────────────────
  const level = getLevel(levelId)
  if (!level) {
    return Response.json({ error: 'Invalid level' }, { status: 400 })
  }

  // ── Validate input length ───────────────────────────────────────
  if (prompt.length > level.maxInputLength) {
    return Response.json(
      {
        error: `Input too long. Maximum ${level.maxInputLength} characters.`,
      },
      { status: 400 }
    )
  }

  // ── Budget check ────────────────────────────────────────────────
  try {
    const budget = await getDailyBudget()
    if (budget >= BUDGET_SHUTDOWN_THRESHOLD) {
      return Response.json(
        { error: 'SYSTEM MAINTENANCE — BACK SOON' },
        { status: 503 }
      )
    }
    if (budget >= BUDGET_WARN_THRESHOLD && levelId >= 6) {
      return Response.json(
        { error: 'ADVANCED DEFENSES UNDER MAINTENANCE' },
        { status: 503 }
      )
    }
  } catch {
    // Budget check failure — allow through (fail open for budget)
  }

  // ── Rate limit ──────────────────────────────────────────────────
  const ip = getClientIP(request)
  try {
    const rateCheck = await checkAttemptAllowed(ip, levelId)
    if (!rateCheck.allowed) {
      return Response.json({ error: rateCheck.reason }, { status: 429 })
    }
  } catch (error) {
    console.error('Rate limiting unavailable:', error)
    // Fail open on rate limit errors in dev, closed in prod
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      )
    }
  }

  // ── Increment budget counter ────────────────────────────────────
  try {
    await incrementBudgetCounter()
  } catch {
    // Non-critical — proceed anyway
  }

  // ── Stream defense pipeline ─────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: SSEEvent) {
        controller.enqueue(encoder.encode(formatSSE(event)))
      }

      try {
        const pipelineResult = await runDefensePipeline(
          level,
          prompt,
          // onStageUpdate callback
          (stage, status, durationMs, reason) => {
            emit({
              type: 'stage_update',
              data: { stage, status, durationMs, reason },
            })
          },
          // onToken callback
          (text) => {
            emit({ type: 'token', data: { text } })
          }
        )

        // Build result
        const attemptsUsed = 1 // Client tracks total, server just reports this attempt
        const score = pipelineResult.secretLeaked
          ? calculateScore(levelId, attemptsUsed)
          : 0

        // Determine hint (client sends attempt count for hint logic)
        // For now, hints are client-side based on attempt count
        const result: AttemptResult = {
          response: pipelineResult.response,
          success: pipelineResult.secretLeaked,
          score: pipelineResult.secretLeaked ? score : undefined,
          defenseLog: pipelineResult.stages
            .filter((s) => s.reason)
            .map((s) => `${s.name}: ${s.reason}`),
          attemptsUsed,
          blockedAtStage: pipelineResult.blockedAtStage,
          secret: pipelineResult.secretLeaked ? level.secret : undefined,
        }

        emit({ type: 'result', data: result })
      } catch (error) {
        console.error('[attempt] Pipeline error:', error)
        emit({
          type: 'error',
          data: { message: 'TARGET SYSTEM OFFLINE. Retry in 30s.' },
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
