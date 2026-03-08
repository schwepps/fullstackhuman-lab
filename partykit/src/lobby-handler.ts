import type * as Party from 'partykit/server'
import type { Player } from '../../lib/game/types'
import {
  AVATAR_COLORS,
  MIN_PLAYERS,
  VOTE_TIMEOUT_MS,
  ALARM_ROUND_END,
  ALARM_VOTE_END,
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
  }

  // Update player in Redis with lobby choices
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
  } catch {
    // Non-critical
  }

  // Only host (first connected player) can start
  const firstPlayer = state.connToPlayer.values().next().value
  if (playerId !== firstPlayer) return

  const uniquePlayers = new Set(state.connToPlayer.values())
  if (uniquePlayers.size < MIN_PLAYERS) return

  // Fill empty slots with auto-agents
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    await roomStore.update(roomId, (r) => {
      const activeCount = Array.from(r.players.values()).filter(
        (p) => p.type !== 'spectator'
      ).length
      const agentsNeeded = Math.max(0, MIN_PLAYERS - activeCount)
      const availablePersonas = PERSONAS.filter((p) => !r.players.has(p.id))

      for (let i = 0; i < agentsNeeded && i < availablePersonas.length; i++) {
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
        r.players.set(persona.id, agentPlayer)

        state.displayNames.set(persona.id, persona.name)
        state.zones.set(persona.id, 'main')
        state.positions.set(persona.id, agentPlayer.position)

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
      return r
    })
  } catch {
    // Room may not exist yet
  }

  await startRound(partyRoom, roomId, 1, state)
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
  } catch {
    // Non-critical — use default roundDuration
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

  // Set alarm for round end
  await partyRoom.storage.put('currentAlarm', ALARM_ROUND_END)
  await partyRoom.storage.setAlarm(Date.now() + roundDuration * 1000)
}

export async function endRound(
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  state.currentPhase = 'vote'

  try {
    const { roomStore } = await import('../../lib/game/room-store')
    await roomStore.update(roomId, (r) => {
      r.phase = 'vote'
      return r
    })
  } catch {
    // Non-critical
  }

  partyRoom.broadcast(JSON.stringify({ type: 'phase_change', phase: 'vote' }))

  await partyRoom.storage.put('currentAlarm', ALARM_VOTE_END)
  await partyRoom.storage.setAlarm(Date.now() + VOTE_TIMEOUT_MS)
}
