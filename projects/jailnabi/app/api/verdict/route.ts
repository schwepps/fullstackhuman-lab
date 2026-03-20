import { NextResponse } from 'next/server'
import {
  getCurrentRound,
  getRoundEvidence,
  getRoundDefenses,
  advancePhase,
  setConvict,
} from '@/lib/round-manager'
import { generateVerdict } from '@/lib/verdict-generator'
import {
  addConviction,
  addProsecutionWin,
  addProsecution,
} from '@/lib/record-manager'
import { getSkillForRound } from '@/lib/techniques'
import { getRedisClient } from '@/lib/upstash'
import { REDIS_KEYS, RESULT_TTL_SECONDS } from '@/lib/constants'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { nanoid } from 'nanoid'
import type { ConvictionEntry, ShareableResult } from '@/lib/types'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'Too many requests.' })}\n\n`,
      { status: 429, headers: sseHeaders() }
    )
  }

  const round = await getCurrentRound()
  if (!round || round.phase !== 'deliberation') {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'Round is not in deliberation phase.' })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const [evidence, defenses] = await Promise.all([
    getRoundEvidence(round.id),
    getRoundDefenses(round.id),
  ])

  if (evidence.length === 0) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'No evidence to judge.' })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const skill = getSkillForRound(round.skillIndex)
  const redis = getRedisClient()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `event: stage_update\ndata: ${JSON.stringify({ stage: 'deliberating', status: 'processing' })}\n\n`
          )
        )

        const verdict = await generateVerdict(
          round.id,
          round.crimeText,
          evidence,
          defenses,
          skill,
          (token) => {
            controller.enqueue(
              encoder.encode(
                `event: verdict_token\ndata: ${JSON.stringify({ text: token })}\n\n`
              )
            )
          }
        )

        // Store verdict
        await redis.set(
          REDIS_KEYS.roundVerdict(round.id),
          JSON.stringify(verdict)
        )

        // Set convict on round
        await setConvict(round.id, verdict.convictId)

        // Update records first so we have accurate conviction count
        const resultId = nanoid(16)
        const convictionEntry: ConvictionEntry = {
          roundId: round.id,
          crimeText: round.crimeText,
          convictedBy: verdict.winningAccuserName,
          winningEvidence: verdict.winningEvidence.slice(0, 300),
          explanation: verdict.explanation,
          date: verdict.generatedAt,
          resultId,
        }
        await addConviction(verdict.convictId, convictionEntry)
        await addProsecutionWin(verdict.winningAccuserId)

        // Track all prosecutors
        const prosecutorIds = new Set(evidence.map((e) => e.accuserId))
        for (const pid of prosecutorIds) {
          await addProsecution(pid)
        }

        // Create shareable result with accurate conviction count
        const convictRecord = await redis.hget(
          REDIS_KEYS.record(verdict.convictId),
          'totalConvictions'
        )
        const shareableResult: ShareableResult = {
          id: resultId,
          roundId: round.id,
          crimeText: round.crimeText,
          convictId: verdict.convictId,
          convictName: verdict.convictName,
          convictionCount: Number(convictRecord) || 1,
          winningEvidence: verdict.winningEvidence,
          winningAccuserName: verdict.winningAccuserName,
          explanation: verdict.explanation,
          createdAt: verdict.generatedAt,
        }
        await redis.set(
          REDIS_KEYS.result(resultId),
          JSON.stringify(shareableResult),
          { ex: RESULT_TTL_SECONDS }
        )

        // Advance to verdict phase
        await advancePhase(round.id)

        controller.enqueue(
          encoder.encode(
            `event: verdict_complete\ndata: ${JSON.stringify(verdict)}\n\n`
          )
        )

        controller.enqueue(
          encoder.encode(
            `event: result\ndata: ${JSON.stringify({ resultId })}\n\n`
          )
        )
      } catch {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: 'Verdict generation failed. Please try again.' })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

export async function GET() {
  const round = await getCurrentRound()
  if (!round) {
    return NextResponse.json({ verdict: null })
  }

  const redis = getRedisClient()
  const raw = await redis.get(REDIS_KEYS.roundVerdict(round.id))
  if (!raw) {
    return NextResponse.json({ verdict: null })
  }

  const verdict = typeof raw === 'string' ? JSON.parse(raw) : raw
  return NextResponse.json({ verdict })
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  }
}
