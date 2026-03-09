import type * as Party from 'partykit/server'
import type {
  Room,
  Player,
  RoundResult,
  GameResult,
} from '../../lib/game/types'
import { isAgentType } from '../../lib/game/types'
import {
  ELIMINATION_PAUSE_MS,
  ALARM_START_ROUND,
} from '../../lib/game/constants'
import type { GameState } from './game-state'

export async function handleVote(
  partyRoom: Party.Room,
  voterId: string | null,
  targetId: string | null,
  roomId: string,
  state: GameState
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
    (p) => isAgentType(p.type) && !room.votes.has(p.id)
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
    } catch (e) {
      console.error('[handleVote] Agent voting failed:', e)
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
    await advanceRound(updatedRoom, roomId, partyRoom, state)
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
    if (isAgentType(eliminatedPlayer.type)) {
      for (const [vid, tid] of r.votes) {
        if (tid === eliminatedId) {
          const voter = r.players.get(vid)
          if (voter) voter.correctVotes++
        }
      }
    }

    return r
  })

  // Track elimination in-memory for onMessage gate
  state.eliminatedPlayers.add(eliminatedId)

  partyRoom.broadcast(
    JSON.stringify({
      type: 'elimination',
      playerId: eliminatedId,
      displayName: eliminatedPlayer.displayName,
    })
  )

  await advanceRound(updatedRoom, roomId, partyRoom, state)
}

async function advanceRound(
  room: Room,
  roomId: string,
  partyRoom: Party.Room,
  state: GameState
) {
  const { roomStore } = await import('../../lib/game/room-store')
  const currentRoom = await roomStore.get(roomId)
  if (!currentRoom) return

  const activePlayers = getActivePlayers(currentRoom)

  if (currentRoom.round >= currentRoom.maxRounds || activePlayers.length <= 1) {
    await triggerReveal(currentRoom, roomId, partyRoom, state)
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
  partyRoom: Party.Room,
  state: GameState
) {
  // Stop agent behavior during reveal
  const { stopAgentLoop } = await import('./agent-behavior-loop')
  stopAgentLoop(state)

  const { roomStore } = await import('../../lib/game/room-store')
  const { calculateScores } = await import('../../lib/game/score-calculator')

  // Re-read latest state for correct roundsSurvived/correctVotes
  const latestRoom = (await roomStore.get(roomId)) ?? room

  // Mutate in-memory for score calculation — persisted separately in roomStore.update below
  for (const [, player] of latestRoom.players) {
    if (!player.isEliminated) {
      player.roundsSurvived = latestRoom.round
    }
  }

  const agentsSurvived: string[] = []
  const agentsCaught: string[] = []
  const humansEliminated: string[] = []
  const promptReveal: GameResult['promptReveal'] = []

  for (const [, player] of latestRoom.players) {
    const isAgent = isAgentType(player.type)
    if (isAgent && !player.isEliminated) agentsSurvived.push(player.id)
    if (isAgent && player.isEliminated) agentsCaught.push(player.id)
    if (player.type === 'human' && player.isEliminated) {
      humansEliminated.push(player.id)
    }

    if (
      player.type === 'custom-agent' &&
      player.customPrompt &&
      (player.revealPreference === 'public' ||
        player.revealPreference === 'leaderboard')
    ) {
      promptReveal.push({
        playerId: player.id,
        displayName: player.displayName,
        prompt: player.customPrompt,
        humanityScore: Math.round(
          (player.roundsSurvived / Math.max(1, latestRoom.round)) * 100
        ),
        roundsSurvived: player.roundsSurvived,
        totalRounds: latestRoom.round,
        votesReceivedPerRound: [],
      })
    }
  }

  const scoresMap = calculateScores(latestRoom)
  const scores = Object.fromEntries(scoresMap)

  const result: GameResult = {
    wasAllHumans: agentsSurvived.length === 0 && agentsCaught.length === 0,
    wasAllAgents: !Array.from(latestRoom.players.values()).some(
      (p) => p.type === 'human'
    ),
    agentsSurvived,
    agentsCaught,
    humansEliminated,
    scores,
    promptReveal,
  }

  await roomStore.update(roomId, (r) => {
    r.phase = 'reveal'
    r.results = result
    for (const [, player] of r.players) {
      if (!player.isEliminated) {
        player.roundsSurvived = r.round
      }
    }
    return r
  })

  // Build reveal players — strip chatHistory, don't leak session tokens
  const allPlayers = Array.from(latestRoom.players.values()).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    type: p.type,
    avatarColor: p.avatarColor,
    isEliminated: p.isEliminated,
    score: scores[p.id] ?? 0,
    roundsSurvived: p.roundsSurvived,
    correctVotes: p.correctVotes,
    position: p.position,
    currentZone: p.currentZone,
    isConnected: p.isConnected,
    model: isAgentType(p.type) ? p.model : undefined,
    revealPreference: p.revealPreference,
    customPrompt:
      p.type === 'custom-agent' &&
      (p.revealPreference === 'public' || p.revealPreference === 'leaderboard')
        ? p.customPrompt
        : undefined,
  }))

  partyRoom.broadcast(
    JSON.stringify({
      type: 'reveal',
      result: {
        ...result,
        scores: result.scores,
      },
      allPlayers,
      roundResults: latestRoom.roundResults,
    })
  )
}

function getActivePlayers(room: Room): Player[] {
  return Array.from(room.players.values()).filter(
    (p) => !p.isEliminated && p.type !== 'spectator'
  )
}
