import 'server-only'
import { callClaude } from './claude-client'
import { SCORER_MODEL, AI_SCORE_WEIGHT, VOTE_SCORE_WEIGHT } from './constants'
import type { RoundMessage, RoundVotes, GuiltScore, AISkill } from './types'

const MAX_SCORER_TOKENS = 1024

/**
 * Score guilt for each player after a round.
 * Combines AI judgment (60%) with player votes (40%).
 * Also produces a 1-sentence AI tip for the highest scorer.
 */
export async function scoreRound(
  crime: string,
  messages: RoundMessage[],
  votes: RoundVotes,
  previousScores: GuiltScore[],
  skill: AISkill
): Promise<{ scores: GuiltScore[]; tip: string }> {
  // Count votes per player
  const voteCounts = new Map<string, number>()
  for (const votedFor of Object.values(votes)) {
    voteCounts.set(votedFor, (voteCounts.get(votedFor) ?? 0) + 1)
  }
  const totalVotes = Object.keys(votes).length

  // Get AI scores
  const messageSummary = messages
    .map(
      (m) =>
        `${m.playerName} (${m.isDefense ? 'defending' : 'accusing'}${m.targetName ? ` ${m.targetName}` : ''}): "${m.prompt}" → Generated: ${m.generatedContent.slice(0, 200)}`
    )
    .join('\n\n')

  const systemPrompt = `You are the AI judge of Jailnabi. Score each player's guilt based on:
1. How convincing the evidence against them is
2. How weak their defense is (if they defended)
3. Whether other players' accusations target them

Crime: "${crime}"
AI Skill this game: "${skill.name}" — "${skill.tip}"

Respond with JSON inside <scores> tags:
<scores>
{
  "players": [
    { "playerName": "Name", "aiGuilt": 50, "reasoning": "one sentence" }
  ],
  "tip": "One sentence tip about the best prompt technique used this round"
}
</scores>

aiGuilt should be 0-100 where 100 = extremely guilty.`

  const response = await callClaude(
    SCORER_MODEL,
    systemPrompt,
    messageSummary,
    MAX_SCORER_TOKENS
  )

  const match = response.match(/<scores>([\s\S]*?)<\/scores>/)
  if (!match) throw new Error('Failed to parse scores')

  const parsed = JSON.parse(match[1]) as {
    players: Array<{ playerName: string; aiGuilt: number; reasoning: string }>
    tip: string
  }

  // Build previous score map for accumulation
  const prevMap = new Map(
    previousScores.map((s) => [s.sessionId, s.guiltScore])
  )

  // Combine AI scores (60%) + vote scores (40%)
  const scores: GuiltScore[] = messages.map((msg) => {
    const aiEntry = parsed.players.find((p) => p.playerName === msg.playerName)
    const aiGuilt = clamp(aiEntry?.aiGuilt ?? 50, 0, 100)

    const voteCount = voteCounts.get(msg.sessionId) ?? 0
    const voteGuilt = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

    const roundScore = Math.round(
      aiGuilt * AI_SCORE_WEIGHT + voteGuilt * VOTE_SCORE_WEIGHT
    )

    // Accumulate with previous rounds
    const previousGuilt = prevMap.get(msg.sessionId) ?? 0
    const cumulativeGuilt = Math.round((previousGuilt + roundScore) / 2)

    return {
      playerName: msg.playerName,
      sessionId: msg.sessionId,
      guiltScore: clamp(cumulativeGuilt, 0, 100),
      reasoning: aiEntry?.reasoning ?? '',
    }
  })

  // Include players who didn't submit (they get guilt boost for absence)
  // This is handled by the caller if needed

  return { scores, tip: parsed.tip }
}

function clamp(value: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}
