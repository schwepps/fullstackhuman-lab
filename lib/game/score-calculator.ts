import type { Room } from '@/lib/game/types'
import { isAgentType } from '@/lib/game/types'

const CORRECT_VOTE_POINTS = 20
const ROUND_SURVIVED_POINTS = 10
const NEVER_ELIMINATED_BONUS = 30
const SPECTATOR_CORRECT_VOTE_POINTS = 15
const ELIMINATED_CORRECT_VOTE_POINTS = 15

export function calculateScores(room: Room): Map<string, number> {
  const scores = new Map<string, number>()

  for (const [id, player] of room.players) {
    const isAgent = isAgentType(player.type)

    // Agents don't get scores (they have humanityScore instead)
    if (isAgent) {
      scores.set(id, 0)
      continue
    }

    if (player.type === 'spectator') {
      scores.set(id, player.correctVotes * SPECTATOR_CORRECT_VOTE_POINTS)
      continue
    }

    // Human scoring
    let score = 0

    if (player.isEliminated) {
      // Eliminated players: +15 per correct post-elimination vote
      score = player.correctVotes * ELIMINATED_CORRECT_VOTE_POINTS
    } else {
      // Active humans: +20 per correct vote, +10 per round survived, +30 bonus
      score =
        player.correctVotes * CORRECT_VOTE_POINTS +
        player.roundsSurvived * ROUND_SURVIVED_POINTS +
        NEVER_ELIMINATED_BONUS
    }

    scores.set(id, score)
  }

  return scores
}
