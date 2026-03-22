import 'server-only'
import { callClaude } from './claude-client'
import { VERDICT_MODEL } from './constants'
import type { GuiltScore, FinalVerdict } from './types'
import { nanoid } from 'nanoid'

const MAX_VERDICT_TOKENS = 512

/**
 * Generate the final verdict — who's convicted, their sentence, and explanation.
 */
export async function generateFinalVerdict(
  crime: string,
  scores: GuiltScore[]
): Promise<FinalVerdict> {
  const sorted = [...scores].sort((a, b) => b.guiltScore - a.guiltScore)
  const convict = sorted[0]

  const scoreSummary = sorted
    .map((s) => `${s.playerName}: guilt ${s.guiltScore}/100 — ${s.reasoning}`)
    .join('\n')

  const systemPrompt = `You are the AI judge of Jailnabi delivering the final verdict.

The crime was: "${crime}"
The most guilty player is: ${convict.playerName} (guilt score: ${convict.guiltScore}/100)

Generate:
1. A funny sentence/punishment (e.g., "3 years of mandatory team-building exercises", "Lifetime ban from the coffee machine")
2. A dramatic 2-3 sentence explanation of why they're convicted

Respond with JSON inside <verdict> tags:
<verdict>
{
  "sentence": "the funny punishment",
  "explanation": "dramatic explanation"
}
</verdict>`

  const response = await callClaude(
    VERDICT_MODEL,
    systemPrompt,
    scoreSummary,
    MAX_VERDICT_TOKENS
  )

  const match = response.match(/<verdict>([\s\S]*?)<\/verdict>/)
  if (!match) throw new Error('Failed to parse verdict')

  const parsed = JSON.parse(match[1]) as {
    sentence: string
    explanation: string
  }

  return {
    convictName: convict.playerName,
    convictSessionId: convict.sessionId,
    crime,
    sentence: parsed.sentence,
    explanation: parsed.explanation,
    scores: sorted,
    resultId: nanoid(16),
  }
}
