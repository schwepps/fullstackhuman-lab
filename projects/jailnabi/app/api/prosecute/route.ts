import { z } from 'zod'
import { getCurrentRound, storeEvidence } from '@/lib/round-manager'
import { generateEvidence } from '@/lib/evidence-generator'
import { validatePrompt } from '@/lib/anti-gaming'
import { isValidMemberId, getMember } from '@/lib/members'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { getSkillForRound } from '@/lib/techniques'
import { countWords } from '@/lib/word-counter'
import type { Evidence, EvidenceType } from '@/lib/types'

const VALID_EVIDENCE_TYPES: EvidenceType[] = [
  'slack',
  'linkedin',
  'email',
  'meeting',
  'expense',
]

const prosecuteSchema = z.object({
  accuserId: z.string().refine(isValidMemberId, 'Invalid accuser ID'),
  suspectId: z.string().refine(isValidMemberId, 'Invalid suspect ID'),
  prompt: z.string().min(1),
  evidenceType: z.enum(['slack', 'linkedin', 'email', 'meeting', 'expense']),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'Too many requests.' })}\n\n`,
      { status: 429, headers: sseHeaders() }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'Invalid JSON body' })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const parsed = prosecuteSchema.safeParse(body)

  if (!parsed.success) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: parsed.error.issues[0].message })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const { accuserId, suspectId, prompt, evidenceType } = parsed.data

  // Validate round is in prosecution phase
  const round = await getCurrentRound()
  if (!round || round.phase !== 'prosecution') {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'No active prosecution phase.' })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  // Validate prompt
  const validation = validatePrompt(prompt)
  if (!validation.isValid) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: validation.reason })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  // Validate evidence type
  if (!VALID_EVIDENCE_TYPES.includes(evidenceType)) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ message: 'Invalid evidence type.' })}\n\n`,
      { status: 400, headers: sseHeaders() }
    )
  }

  const accuser = getMember(accuserId)
  const suspect = getMember(suspectId)
  const skill = getSkillForRound(round.skillIndex)

  // Stream evidence generation
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stage: validating
        controller.enqueue(
          encoder.encode(
            `event: stage_update\ndata: ${JSON.stringify({ stage: 'validating', status: 'passed' })}\n\n`
          )
        )

        controller.enqueue(
          encoder.encode(
            `event: validation\ndata: ${JSON.stringify({ isValid: true, wordCount: validation.wordCount })}\n\n`
          )
        )

        // Stage: generating
        controller.enqueue(
          encoder.encode(
            `event: stage_update\ndata: ${JSON.stringify({ stage: 'generating', status: 'processing' })}\n\n`
          )
        )

        let fullEvidence = ''
        const generatedEvidence = await generateEvidence(
          prompt,
          evidenceType,
          suspect.name,
          round.crimeText,
          skill,
          (token) => {
            fullEvidence += token
            controller.enqueue(
              encoder.encode(
                `event: evidence_token\ndata: ${JSON.stringify({ text: token })}\n\n`
              )
            )
          }
        )

        fullEvidence = generatedEvidence

        controller.enqueue(
          encoder.encode(
            `event: evidence_complete\ndata: ${JSON.stringify({ evidence: fullEvidence, wordCount: validation.wordCount })}\n\n`
          )
        )

        controller.enqueue(
          encoder.encode(
            `event: stage_update\ndata: ${JSON.stringify({ stage: 'generating', status: 'passed' })}\n\n`
          )
        )

        // Store evidence
        const evidence: Evidence = {
          accuserId,
          accuserName: accuser.name,
          suspectId,
          suspectName: suspect.name,
          prompt,
          evidenceType,
          generatedEvidence: fullEvidence,
          wordCount: countWords(prompt),
          submittedAt: new Date().toISOString(),
        }

        await storeEvidence(round.id, accuserId, evidence)

        controller.enqueue(
          encoder.encode(
            `event: result\ndata: ${JSON.stringify({ success: true })}\n\n`
          )
        )
      } catch {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: 'Evidence generation failed. Please try again.' })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  }
}
