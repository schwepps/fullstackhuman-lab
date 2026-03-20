import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getLevel } from '@/lib/levels'
import { runDefensePipeline } from '@/lib/defense-engine'
import {
  checkAttemptAllowed,
  incrementBudgetCounter,
  getDailyBudget,
  recordLevelWin,
  incrementAttemptCount,
} from '@/lib/rate-limiter'
import { calculateScore } from '@/lib/scoring'
import { saveResult } from '@/lib/result-store'
import type { SSEEvent, AttemptResult } from '@/lib/types'
import {
  BUDGET_WARN_THRESHOLD,
  BUDGET_SHUTDOWN_THRESHOLD,
  TOTAL_LEVELS,
  MAX_INPUT_LENGTH_BASIC,
} from '@/lib/constants'

const requestSchema = z.object({
  levelId: z.number().int().min(1).max(TOTAL_LEVELS),
  prompt: z
    .string()
    .trim()
    .min(1)
    .max(MAX_INPUT_LENGTH_BASIC * 2),
  sessionId: z.string().uuid(),
})

function generateResultId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 20)
}

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
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { levelId, prompt, sessionId } = parsed.data

  // ── Get level config ────────────────────────────────────────────
  const level = getLevel(levelId)
  if (!level) {
    return Response.json({ error: 'Invalid level' }, { status: 400 })
  }

  // ── Validate input length ───────────────────────────────────────
  if (prompt.length > level.maxInputLength) {
    return Response.json(
      { error: `Input too long. Maximum ${level.maxInputLength} characters.` },
      { status: 400 }
    )
  }

  // ── Budget check (fail closed in production) ──────────────────
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
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      )
    }
  }

  // ── Rate limit ──────────────────────────────────────────────────
  const ip = getClientIP(request)
  try {
    const rateCheck = await checkAttemptAllowed(ip, levelId)
    if (!rateCheck.allowed) {
      return Response.json(
        { error: rateCheck.reason },
        {
          status: 429,
          headers: rateCheck.retryAfterSeconds
            ? { 'Retry-After': String(rateCheck.retryAfterSeconds) }
            : undefined,
        }
      )
    }
  } catch (error) {
    console.error('Rate limiting unavailable:', error)
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
        try {
          controller.enqueue(encoder.encode(formatSSE(event)))
        } catch {
          // Stream may be closed (client disconnected)
        }
      }

      try {
        // Track attempt count server-side for accurate scoring
        let attemptsUsed = 1
        try {
          attemptsUsed = await incrementAttemptCount(sessionId, levelId)
        } catch {
          // Non-critical — fall back to 1
        }

        // Run the full defense pipeline (tokens are buffered server-side,
        // NOT streamed to the client during generation).
        const pipelineResult = await runDefensePipeline(
          level,
          prompt,
          (stage, status, durationMs, reason) => {
            emit({
              type: 'stage_update',
              data: { stage, status, durationMs, reason },
            })
          }
        )

        // Stream the response text AFTER all defense checks have passed.
        // This prevents leaking secrets via raw token stream.
        const responseText =
          pipelineResult.response ??
          (pipelineResult.blockedAtStage ? '[BLOCKED]' : '')
        if (responseText) {
          // Simulate streaming for the typewriter UX
          const chunkSize = 8
          for (let i = 0; i < responseText.length; i += chunkSize) {
            emit({
              type: 'token',
              data: { text: responseText.slice(i, i + chunkSize) },
            })
          }
        }

        // Build result
        const score = pipelineResult.secretLeaked
          ? calculateScore(levelId, attemptsUsed)
          : 0

        // Save shareable result for OG images + result page
        let resultId: string | undefined
        if (pipelineResult.secretLeaked && score > 0) {
          resultId = generateResultId()
          try {
            await saveResult({
              id: resultId,
              levelId,
              levelName: level.name,
              score,
              attemptsUsed,
              completedAt: new Date().toISOString(),
            })
          } catch {
            resultId = undefined // Non-critical — sharing just won't have a unique URL
          }
        }

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
          resultId,
        }

        // Store win server-side for leaderboard verification
        if (pipelineResult.secretLeaked && score > 0) {
          try {
            await recordLevelWin(sessionId, levelId, score)
          } catch {
            // Non-critical — proceed anyway
          }
        }

        emit({ type: 'result', data: result })
      } catch (error) {
        console.error('[attempt] Pipeline error:', error)
        emit({
          type: 'error',
          data: { message: 'TARGET SYSTEM OFFLINE. Retry in 30s.' },
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
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
