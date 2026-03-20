import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getChallenge, isCodeChallenge } from '@/lib/challenges'
import { validatePrompt } from '@/lib/anti-gaming'
import { generateCode } from '@/lib/code-generator'
import { judgeCode } from '@/lib/judge'
import { analyzeSwing } from '@/lib/swing-analyzer'
import { calculateScore } from '@/lib/scoring'
import {
  checkAttemptAllowed,
  incrementBudgetCounter,
  incrementAttemptCount,
  getAttemptCount,
  consumeMulligan,
} from '@/lib/rate-limiter'
import { saveResult } from '@/lib/result-store'
import {
  BUDGET_WARN_THRESHOLD,
  BUDGET_SHUTDOWN_THRESHOLD,
} from '@/lib/constants'
import type { SSEEvent, ShareableResult } from '@/lib/types'

const requestSchema = z.object({
  challengeId: z.string().regex(/^[a-z0-9-]+$/),
  prompt: z.string().trim().min(1).max(2000),
  sessionId: z.string().uuid(),
  isPractice: z.boolean().default(false),
  isMulligan: z.boolean().default(false),
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
      { error: 'Course closed for maintenance. Back soon.' },
      { status: 503 }
    )
  }

  // ── Parse request ───────────────────────────────────────────────
  let body: z.infer<typeof requestSchema>
  try {
    const raw = await request.json()
    body = requestSchema.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { challengeId, prompt, sessionId, isPractice, isMulligan } = body

  // ── Validate challenge exists ───────────────────────────────────
  const challenge = getChallenge(challengeId)
  if (!challenge || !isCodeChallenge(challenge)) {
    return Response.json({ error: 'Unknown hole.' }, { status: 404 })
  }

  // ── Rate limiting ───────────────────────────────────────────────
  const ip = getClientIP(request)
  const rateLimitResult = await checkAttemptAllowed(ip, challengeId, isPractice)
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: rateLimitResult.reason },
      {
        status: 429,
        headers: rateLimitResult.retryAfterSeconds
          ? { 'Retry-After': String(rateLimitResult.retryAfterSeconds) }
          : undefined,
      }
    )
  }

  // ── Budget check ────────────────────────────────────────────────
  const budgetCount = await incrementBudgetCounter()
  if (budgetCount >= BUDGET_SHUTDOWN_THRESHOLD) {
    return Response.json(
      { error: 'Course closed for the day. Try again tomorrow.' },
      { status: 503 }
    )
  }
  if (budgetCount >= BUDGET_WARN_THRESHOLD) {
    console.warn(
      `[swing] Budget warning: ${budgetCount}/${BUDGET_SHUTDOWN_THRESHOLD} daily swings`
    )
  }

  // ── Mulligan check ──────────────────────────────────────────────
  if (isMulligan) {
    const mulliganConsumed = await consumeMulligan(sessionId, challenge.course)
    if (!mulliganConsumed) {
      return Response.json(
        { error: 'No mulligans remaining for this course.' },
        { status: 400 }
      )
    }
  }

  // ── Get attempt number ──────────────────────────────────────────
  let attemptNumber = 1
  if (!isPractice && !isMulligan) {
    attemptNumber = await incrementAttemptCount(sessionId, challengeId)
  } else if (!isPractice && isMulligan) {
    attemptNumber = await getAttemptCount(sessionId, challengeId)
    if (attemptNumber < 1) attemptNumber = 1
  }

  // ── SSE Stream ──────────────────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event)))
        } catch {
          // Stream may be closed
        }
      }

      try {
        // Stage 1: Validation
        emit({
          type: 'stage_update',
          data: { stage: 'validating', status: 'processing' },
        })

        const validation = validatePrompt(prompt)
        emit({ type: 'validation', data: validation })

        if (!validation.isValid) {
          emit({
            type: 'stage_update',
            data: { stage: 'validating', status: 'failed' },
          })
          emit({
            type: 'error',
            data: { message: validation.reason ?? 'Invalid prompt.' },
          })
          controller.close()
          return
        }

        emit({
          type: 'stage_update',
          data: { stage: 'validating', status: 'passed' },
        })

        // Stage 2: Code generation (stream tokens live)
        emit({
          type: 'stage_update',
          data: { stage: 'generating', status: 'processing' },
        })

        const generatedCode = await generateCode(challenge, prompt, (token) => {
          emit({ type: 'code_token', data: { text: token } })
        })

        emit({
          type: 'code_complete',
          data: { code: generatedCode, wordCount: validation.wordCount },
        })
        emit({
          type: 'stage_update',
          data: { stage: 'generating', status: 'passed' },
        })

        // Stage 3: Judge (for scored swings only; practice skips judge)
        let pass = false
        let verdictData = {
          pass: false,
          testResults: [] as {
            case: string
            pass: boolean
            reasoning: string
          }[],
          summary: 'Practice swing — no judgment.',
        }

        if (!isPractice) {
          emit({
            type: 'stage_update',
            data: { stage: 'judging', status: 'processing' },
          })

          verdictData = await judgeCode(challenge, generatedCode)
          pass = verdictData.pass

          emit({ type: 'judge_verdict', data: verdictData })
          emit({
            type: 'stage_update',
            data: {
              stage: 'judging',
              status: pass ? 'passed' : 'failed',
            },
          })
        }

        // Stage 4: Analysis + Scoring (in parallel for scored swings)
        emit({
          type: 'stage_update',
          data: { stage: 'analyzing', status: 'processing' },
        })

        const analysisPromise = analyzeSwing(
          challenge,
          prompt,
          generatedCode,
          isPractice ? true : pass
        )

        const score = !isPractice
          ? calculateScore(
              validation.wordCount,
              challenge.par,
              attemptNumber,
              pass
            )
          : null

        const analysis = await analysisPromise

        emit({ type: 'analysis', data: analysis })
        emit({
          type: 'stage_update',
          data: { stage: 'analyzing', status: 'passed' },
        })

        // Save shareable result if scored and passing
        let resultId: string | undefined
        if (!isPractice && pass && score) {
          resultId = generateResultId()
          const shareableResult: ShareableResult = {
            id: resultId,
            challengeId,
            challengeName: challenge.description.slice(0, 100),
            holeName: challenge.name,
            prompt,
            code: generatedCode,
            wordCount: validation.wordCount,
            effectiveStrokes: score.effectiveStrokes,
            par: challenge.par,
            relativeScore: score.relativeScore,
            label: score.label,
            attemptNumber,
            createdAt: new Date().toISOString(),
          }
          await saveResult(shareableResult).catch((err) =>
            console.error('[swing] Failed to save result:', err)
          )
        }

        // Final result
        emit({
          type: 'result',
          data: {
            challengeId,
            prompt,
            code: generatedCode,
            isPractice,
            isMulligan,
            verdict: verdictData,
            score,
            analysis,
            resultId,
          },
        })
      } catch (error) {
        console.error('[swing] Pipeline error:', error)
        emit({
          type: 'error',
          data: {
            message:
              'Something went wrong on the course. Please try another swing.',
          },
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
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
