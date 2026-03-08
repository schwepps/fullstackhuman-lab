import type * as Party from 'partykit/server'
import type {
  Room,
  Player,
  RoundResult,
  GameResult,
} from '../../lib/game/types'
import { ELIMINATION_PAUSE_MS } from '../../lib/game/constants'

const ALARM_START_ROUND = 'alarm:startRound'

export async function handleVote(
  partyRoom: Party.Room,
  voterId: string | null,
  targetId: string | null,
  roomId: string
) {
  const { roomStore } = await import('../../lib/game/room-store')

  // Record human vote
  if (voterId && targetId) {
    await roomStore.update(roomId, (r) => {
      const voter = r.players.get(voterId)
      if (!voter || voter.isEliminated) return r
      r.votes.set(voterId, targetId)
      return r
    })

    // Broadcast progress (count only, no names)
    const room = await roomStore.get(roomId)
    if (room) {
      const activePlayers = getActivePlayers(room)
      const voteCount = room.votes.size
      partyRoom.broadcast(
        JSON.stringify({
          type: 'vote_progress',
          count: voteCount,
          total: activePlayers.length,
        })
      )
    }
  }

  // Trigger agent votes
  const room = await roomStore.get(roomId)
  if (!room) return

  const activePlayers = getActivePlayers(room)
  const agents = activePlayers.filter(
    (p) =>
      (p.type === 'auto-agent' || p.type === 'custom-agent') &&
      !room.votes.has(p.id)
  )

  if (agents.length > 0) {
    try {
      const { generateAgentVote } = await import('./agent-manager')
      for (const agent of agents) {
        const candidates = activePlayers.filter((p) => p.id !== agent.id)
        const voteTargetId = await generateAgentVote(agent, room, candidates)
        if (voteTargetId) {
          await roomStore.update(roomId, (r) => {
            r.votes.set(agent.id, voteTargetId)
            return r
          })
        }
      }
    } catch {
      // Agent voting failure is non-critical
    }
  }

  // Re-read room after agent votes
  const updatedRoom = await roomStore.get(roomId)
  if (!updatedRoom) return

  const allActive = getActivePlayers(updatedRoom)
  const allVoted = allActive.every((p) => updatedRoom.votes.has(p.id))

  // If not all voted and this isn't a timeout, wait for more
  if (!allVoted && voterId != null) return

  // Tally votes
  const voteCounts = new Map<string, number>()
  for (const [, target] of updatedRoom.votes) {
    voteCounts.set(target, (voteCounts.get(target) ?? 0) + 1)
  }

  // Find most voted
  let maxVotes = 0
  let mostVoted: string[] = []
  for (const [pid, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count
      mostVoted = [pid]
    } else if (count === maxVotes) {
      mostVoted.push(pid)
    }
  }

  // Tie = no elimination
  if (mostVoted.length !== 1) {
    await advanceRound(updatedRoom, roomId, partyRoom, null, voteCounts)
    return
  }

  const eliminatedId = mostVoted[0]
  const eliminatedPlayer = updatedRoom.players.get(eliminatedId)
  if (!eliminatedPlayer) return

  // Eliminate
  await roomStore.update(roomId, (r) => {
    const p = r.players.get(eliminatedId)
    if (p) p.isEliminated = true

    // Record round result
    const voteBreakdown: Record<string, number> = {}
    for (const [pid, count] of voteCounts) {
      const player = r.players.get(pid)
      voteBreakdown[player?.displayName ?? pid] = count
    }

    const result: RoundResult = {
      round: r.round,
      topic: r.currentTopic ?? '',
      eliminatedPlayerId: eliminatedId,
      eliminatedDisplayName: eliminatedPlayer.displayName,
      voteBreakdown,
    }
    r.roundResults.push(result)

    // Update correct voters if eliminated was an agent
    if (
      eliminatedPlayer.type === 'auto-agent' ||
      eliminatedPlayer.type === 'custom-agent'
    ) {
      for (const [vid, tid] of r.votes) {
        if (tid === eliminatedId) {
          const voter = r.players.get(vid)
          if (voter) voter.correctVotes++
        }
      }
    }

    return r
  })

  // CRITICAL: No 'type' field in elimination broadcast — just displayName
  partyRoom.broadcast(
    JSON.stringify({
      type: 'elimination',
      displayName: eliminatedPlayer.displayName,
    })
  )

  await advanceRound(updatedRoom, roomId, partyRoom, eliminatedId, voteCounts)
}

async function advanceRound(
  room: Room,
  roomId: string,
  partyRoom: Party.Room,
  _eliminatedId: string | null,
  _voteCounts: Map<string, number>
) {
  const { roomStore } = await import('../../lib/game/room-store')
  const currentRoom = await roomStore.get(roomId)
  if (!currentRoom) return

  const activePlayers = getActivePlayers(currentRoom)

  if (currentRoom.round >= currentRoom.maxRounds || activePlayers.length <= 1) {
    await triggerReveal(currentRoom, roomId, partyRoom)
    return
  }

  // Set alarm for next round after dramatic pause
  const nextRound = currentRoom.round + 1
  await partyRoom.storage.put('nextRoundNumber', nextRound)
  await partyRoom.storage.put('currentAlarm', ALARM_START_ROUND)
  await partyRoom.storage.setAlarm(Date.now() + ELIMINATION_PAUSE_MS)
}

async function triggerReveal(
  room: Room,
  roomId: string,
  partyRoom: Party.Room
) {
  const { roomStore } = await import('../../lib/game/room-store')

  const agentsSurvived: string[] = []
  const agentsCaught: string[] = []
  const humansEliminated: string[] = []

  for (const [, player] of room.players) {
    const isAgent =
      player.type === 'auto-agent' || player.type === 'custom-agent'
    if (isAgent && !player.isEliminated) agentsSurvived.push(player.id)
    if (isAgent && player.isEliminated) agentsCaught.push(player.id)
    if (player.type === 'human' && player.isEliminated) {
      humansEliminated.push(player.id)
    }
  }

  const result: GameResult = {
    wasAllHumans: agentsSurvived.length === 0 && agentsCaught.length === 0,
    wasAllAgents: humansEliminated.length === room.players.size,
    agentsSurvived,
    agentsCaught,
    humansEliminated,
    scores: new Map(), // Phase 12 will implement scoring
    promptReveal: [],
  }

  await roomStore.update(roomId, (r) => {
    r.phase = 'reveal'
    r.results = result
    return r
  })

  // Build reveal players with type exposed
  const allPlayers = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    type: p.type,
    avatarColor: p.avatarColor,
    isEliminated: p.isEliminated,
    score: p.score,
    roundsSurvived: p.roundsSurvived,
    correctVotes: p.correctVotes,
    position: p.position,
    currentZone: p.currentZone,
    isConnected: p.isConnected,
    model: p.model,
    revealPreference: p.revealPreference,
    customPrompt: p.customPrompt,
  }))

  partyRoom.broadcast(
    JSON.stringify({
      type: 'reveal',
      result: {
        ...result,
        scores: Object.fromEntries(result.scores),
      },
      allPlayers,
    })
  )
}

function getActivePlayers(room: Room): Player[] {
  return Array.from(room.players.values()).filter(
    (p) => !p.isEliminated && p.type !== 'spectator'
  )
}
