import type * as Party from 'partykit/server'
import type { Player } from '../../lib/game/types'
import {
  AVATAR_COLORS,
  MIN_PLAYERS,
  MIN_AGENTS_TO_ADD,
  MAX_AGENTS_TO_ADD,
  MAX_PLAYERS_PER_ROOM,
  VOTE_TIMEOUT_MS,
  ALARM_ROUND_END,
  ALARM_VOTE_END,
  FALLBACK_NAME_LENGTH,
} from '../../lib/game/constants'
import { getNextTopic } from './topic-engine'
import { PERSONAS } from '../../lib/game/agent-personas'
import type { GameState } from './game-state'

export async function handleReady(
  partyRoom: Party.Room,
  roomId: string,
  playerId: string,
  displayName: string | undefined,
  playerType: string | undefined,
  customPrompt: string | undefined,
  state: GameState
) {
  if (state.currentPhase !== 'lobby') return

  if (displayName) {
    state.displayNames.set(playerId, displayName)
    // Broadcast name so other clients (and canvas) update
    partyRoom.broadcast(
      JSON.stringify({
        type: 'player_name_update',
        playerId,
        displayName,
      })
    )
  }

  // Update player in Redis with lobby choices (non-critical)
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    await roomStore.update(roomId, (r) => {
      const player = r.players.get(playerId)
      if (!player) return r
      if (displayName) player.displayName = displayName
      if (
        playerType === 'human' ||
        playerType === 'custom-agent' ||
        playerType === 'spectator'
      ) {
        player.type = playerType
      }
      if (playerType === 'custom-agent' && customPrompt) {
        player.customPrompt = customPrompt
      }
      return r
    })
  } catch (e) {
    console.error('[handleReady] Redis player update failed:', e)
  }

  // Only host can start
  if (playerId !== state.hostId) return

  // ── Lobby validation ──────────────────────────────────────────────────────
  const activeCount = new Set(state.connToPlayer.values()).size

  // Solo human not allowed — need at least 2 players for a meaningful game
  if (playerType === 'human' && activeCount < 2) {
    partyRoom.broadcast(
      JSON.stringify({
        type: 'lobby_error',
        message:
          'Need at least 2 players to play as human. Try custom-agent for solo testing.',
      })
    )
    return
  }

  // ── Spawn agents using in-memory state (Redis-independent) ──────────────
  const minNeeded = Math.max(MIN_AGENTS_TO_ADD, MIN_PLAYERS - activeCount)
  const agentsToAdd =
    minNeeded + Math.floor(Math.random() * (MAX_AGENTS_TO_ADD - minNeeded + 1))
  const availablePersonas = PERSONAS.filter((p) => !state.positions.has(p.id))
  const capped = Math.min(
    agentsToAdd,
    availablePersonas.length,
    MAX_PLAYERS_PER_ROOM - activeCount
  )

  const spawnedAgents: Player[] = []
  for (let i = 0; i < capped; i++) {
    const persona = availablePersonas[i]
    const color =
      AVATAR_COLORS.find((c) => !state.assignedColors.has(c)) ??
      AVATAR_COLORS[0]
    state.assignedColors.add(color)

    const agentPlayer: Player = {
      id: persona.id,
      displayName: persona.name,
      type: 'auto-agent',
      model: 'claude-sonnet-4-6',
      revealPreference: 'public',
      position: {
        x: 400 + Math.random() * 400,
        y: 250 + Math.random() * 300,
      },
      currentZone: 'main',
      avatarColor: color,
      isConnected: true,
      isEliminated: false,
      score: 0,
      roundsSurvived: 0,
      correctVotes: 0,
      sessionToken: crypto.randomUUID(),
      chatHistory: [],
    }
    spawnedAgents.push(agentPlayer)

    // Update in-memory state immediately
    state.displayNames.set(persona.id, persona.name)
    state.zones.set(persona.id, 'main')
    state.positions.set(persona.id, agentPlayer.position)
    state.playerColors.set(persona.id, color)

    // Broadcast to all connected clients
    partyRoom.broadcast(
      JSON.stringify({
        type: 'player_joined',
        player: {
          id: persona.id,
          displayName: persona.name,
          avatarColor: color,
          isConnected: true,
          isEliminated: false,
          position: agentPlayer.position,
        },
      })
    )
  }

  // Persist spawned agents to Redis (non-critical)
  if (spawnedAgents.length > 0) {
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      await roomStore.update(roomId, (r) => {
        for (const agent of spawnedAgents) {
          r.players.set(agent.id, agent)
        }
        return r
      })
    } catch (e) {
      console.error('[handleReady] Redis agent persist failed:', e)
    }
  }

  await startRound(partyRoom, roomId, 1, state)
}

/** Broadcast player_joined for every player to every connection */
function broadcastFullPlayerList(partyRoom: Party.Room, state: GameState) {
  for (const [playerId] of state.positions) {
    partyRoom.broadcast(
      JSON.stringify({
        type: 'player_joined',
        player: {
          id: playerId,
          displayName:
            state.displayNames.get(playerId) ??
            playerId.slice(0, FALLBACK_NAME_LENGTH),
          avatarColor: state.playerColors.get(playerId) ?? AVATAR_COLORS[0],
          position: state.positions.get(playerId),
          isConnected: true,
          isEliminated: false,
        },
      })
    )
  }
}

export async function startRound(
  partyRoom: Party.Room,
  roomId: string,
  roundNumber: number,
  state: GameState
) {
  const topic = getNextTopic(roundNumber)
  const roundStartedAt = Date.now()
  state.currentPhase = 'round'

  let roundDuration = 180
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    const updatedRoom = await roomStore.update(roomId, (r) => {
      r.phase = 'round'
      r.round = roundNumber
      r.currentTopic = topic
      r.votes = new Map()
      r.roundStartedAt = roundStartedAt
      return r
    })
    roundDuration = updatedRoom.roundDuration
  } catch (e) {
    console.error(
      '[startRound] Redis update failed, using default duration:',
      e
    )
  }

  partyRoom.broadcast(
    JSON.stringify({
      type: 'phase_change',
      phase: 'round',
      round: roundNumber,
      topic,
      roundStartedAt,
      roundDuration,
    })
  )

  // Broadcast full player list AFTER phase_change so clients have recreated
  // their canvas. Without this, humans only appear after their first move.
  broadcastFullPlayerList(partyRoom, state)

  // Set alarm for round end, with setTimeout fallback
  try {
    await partyRoom.storage.put('roomId', roomId)
    await partyRoom.storage.put('currentAlarm', ALARM_ROUND_END)
    await partyRoom.storage.setAlarm(Date.now() + roundDuration * 1000)
  } catch (e) {
    console.error(
      '[startRound] Alarm unavailable, using setTimeout fallback:',
      e
    )
    clearAlarmFallback(state)
    state.alarmFallbackTimer = setTimeout(
      () => endRound(partyRoom, roomId, state),
      roundDuration * 1000
    )
  }

  // Start autonomous agent behavior (movement + chat initiative)
  const { startAgentLoop } = await import('./agent-behavior-loop')
  startAgentLoop(partyRoom, roomId, state)
}

export async function endRound(
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  clearAlarmFallback(state)

  // Stop agent behavior during vote phase
  const { stopAgentLoop } = await import('./agent-behavior-loop')
  stopAgentLoop(state)

  state.currentPhase = 'vote'

  try {
    const { roomStore } = await import('../../lib/game/room-store')
    await roomStore.update(roomId, (r) => {
      r.phase = 'vote'
      return r
    })
  } catch (e) {
    console.error('[endRound] Redis update failed:', e)
  }

  partyRoom.broadcast(JSON.stringify({ type: 'phase_change', phase: 'vote' }))

  // If no human connections remain, auto-resolve votes immediately
  const humanIds = new Set(state.connToPlayer.values())
  const hasHumans = Array.from(humanIds).some(
    (pid) => !PERSONAS.some((p) => p.id === pid)
  )

  if (!hasHumans) {
    const { handleVote } = await import('./vote-manager')
    await handleVote(partyRoom, null, null, roomId, state)
    return
  }

  // Set alarm for vote end, with setTimeout fallback
  try {
    await partyRoom.storage.put('currentAlarm', ALARM_VOTE_END)
    await partyRoom.storage.setAlarm(Date.now() + VOTE_TIMEOUT_MS)
  } catch (e) {
    console.error('[endRound] Alarm unavailable, using setTimeout fallback:', e)
    state.alarmFallbackTimer = setTimeout(async () => {
      const { handleVote } = await import('./vote-manager')
      await handleVote(partyRoom, null, null, roomId, state)
    }, VOTE_TIMEOUT_MS)
  }
}

function clearAlarmFallback(state: GameState) {
  if (state.alarmFallbackTimer) {
    clearTimeout(state.alarmFallbackTimer)
    state.alarmFallbackTimer = null
  }
}
