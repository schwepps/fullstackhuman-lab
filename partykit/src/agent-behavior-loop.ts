import type * as Party from 'partykit/server'
import { isAgentType } from '../../lib/game/types'
import {
  AGENT_TICK_MS,
  AGENT_IDLE_BASE_MS,
  AGENT_IDLE_JITTER_MS,
  AGENT_INITIATIVE_COOLDOWN_MS,
  AGENT_ZONE_ENTRY_GREET_CHANCE,
  AGENT_TOPIC_REACT_CHANCE,
  AGENT_IDLE_CHAT_CHANCE,
  AGENT_META_GAME_CHANCE,
  AGENT_TOPIC_REACT_WINDOW_START_MS,
  AGENT_TOPIC_REACT_WINDOW_JITTER_MS,
  AGENT_TOPIC_REACT_WINDOW_END_MS,
  AGENT_ZONE_ENTRY_WINDOW_MS,
  AGENT_ZONE_ENTRY_DELAY_MS,
  AGENT_META_GAME_DELAY_MS,
  AGENT_TOPIC_DRIFT_CHANCE_HIGH,
  AGENT_TOPIC_DRIFT_CHANCE_MEDIUM,
  AGENT_TOPIC_DRIFT_CHANCE_LOW,
} from '../../lib/game/constants'
import { PERSONAS } from '../../lib/game/agent-personas'
import { getPlayersInZone } from './proximity-router'
import type { GameState } from './game-state'
import { resetEmotionsForRound, decayEmotion } from './agent-emotions'
import { movementTick } from './agent-movement'
import type { InitiativeTrigger } from '../../lib/game/prompt-builder'

export function startAgentLoop(
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  stopAgentLoop(state)
  state.agentRoundStartedAt = Date.now()

  // Reset emotions for new round
  resetEmotionsForRound(state)

  let agentIndex = 0
  const agentCount = [...state.positions.keys()].filter((id) =>
    PERSONAS.some((p) => p.id === id)
  ).length

  for (const [playerId] of state.positions) {
    const persona = PERSONAS.find((p) => p.id === playerId)
    if (!persona) continue
    // Initialize emotional state if not present
    if (!state.agentEmotions.has(playerId)) {
      state.agentEmotions.set(playerId, {
        mood: 'engaged',
        trigger: 'new round started',
        since: Date.now(),
      })
    }
    state.agentMovement.set(playerId, {
      waypoint: null,
      waypointReachedAt: 0,
      nextIdleUntil:
        Date.now() + AGENT_IDLE_BASE_MS + Math.random() * AGENT_IDLE_JITTER_MS,
      targetZone: null,
      zoneDwellUntil: 0,
      // Distribute agents evenly across tick phases
      tickPhase: agentCount > 1 ? agentIndex++ : 0,
      journeyStart: null,
      journeyDist: 0,
      curveSign: Math.random() < 0.5 ? 1 : -1,
      axisFirst: Math.random() < 0.5 ? 'x' : 'y',
    })
  }

  let tickCounter = 0
  const id = setInterval(() => {
    try {
      movementTick(partyRoom, state, tickCounter)
      chatInitiativeTick(partyRoom, roomId, state)
      // Decay emotions every ~5 seconds (50 ticks)
      if (tickCounter % 50 === 0) {
        for (const agentId of state.agentEmotions.keys()) {
          decayEmotion(state, agentId)
        }
      }
      tickCounter++
    } catch (e) {
      console.error('[agentLoop] Tick error:', e)
    }
  }, AGENT_TICK_MS)
  state.agentIntervalId = id
  fallbackIntervalId = id
}

export function stopAgentLoop(state?: Pick<GameState, 'agentIntervalId'>) {
  if (state?.agentIntervalId) {
    clearInterval(state.agentIntervalId)
    state.agentIntervalId = null
  }
  // Also clear module-level fallback for callers without state access
  if (fallbackIntervalId) {
    clearInterval(fallbackIntervalId)
    fallbackIntervalId = null
  }
}

// Fallback reference for stopAgentLoop calls without state (e.g., vote-manager).
// Safe in Partykit/Durable Objects: each instance gets its own module scope,
// so this is effectively instance-scoped despite being module-level.
let fallbackIntervalId: ReturnType<typeof setInterval> | null = null

// ─── Chat initiative tick ───────────────────────────────────────────────────

function chatInitiativeTick(
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  const now = Date.now()
  const timeSinceRoundStart = now - state.agentRoundStartedAt

  for (const [playerId, mvState] of state.agentMovement) {
    const persona = PERSONAS.find((p) => p.id === playerId)
    if (!persona) continue

    const lastInitiative = state.agentChatCooldowns.get(playerId) ?? 0
    if (now - lastInitiative < AGENT_INITIATIVE_COOLDOWN_MS) continue

    const currentZone = state.zones.get(playerId) ?? 'main'
    const playersInZone = getPlayersInZone(currentZone, state.zones)
    if (playersInZone.length < 2) continue

    let trigger: InitiativeTrigger | null = null

    if (
      timeSinceRoundStart >
        AGENT_TOPIC_REACT_WINDOW_START_MS +
          Math.random() * AGENT_TOPIC_REACT_WINDOW_JITTER_MS &&
      timeSinceRoundStart < AGENT_TOPIC_REACT_WINDOW_END_MS &&
      lastInitiative < state.agentRoundStartedAt
    ) {
      if (Math.random() < AGENT_TOPIC_REACT_CHANCE) trigger = 'topic_react'
    }

    if (
      !trigger &&
      currentZone !== 'main' &&
      mvState.waypointReachedAt > 0 &&
      now - mvState.waypointReachedAt < AGENT_ZONE_ENTRY_WINDOW_MS &&
      now - mvState.waypointReachedAt > AGENT_ZONE_ENTRY_DELAY_MS
    ) {
      if (Math.random() < AGENT_ZONE_ENTRY_GREET_CHANCE) trigger = 'zone_entry'
    }

    if (
      !trigger &&
      currentZone === 'main' &&
      timeSinceRoundStart > AGENT_META_GAME_DELAY_MS &&
      Math.random() < AGENT_META_GAME_CHANCE
    ) {
      trigger = 'meta_game'
    }

    // Topic drift — higher chance for casual personas, adds natural tangents
    if (!trigger) {
      const driftChance =
        persona.casualness === 'high'
          ? AGENT_TOPIC_DRIFT_CHANCE_HIGH
          : persona.casualness === 'medium'
            ? AGENT_TOPIC_DRIFT_CHANCE_MEDIUM
            : AGENT_TOPIC_DRIFT_CHANCE_LOW
      if (Math.random() < driftChance) {
        trigger = 'topic_drift'
      }
    }

    if (!trigger && Math.random() < AGENT_IDLE_CHAT_CHANCE) {
      trigger = 'idle_chat'
    }

    if (trigger) {
      state.agentChatCooldowns.set(playerId, now)
      fireAgentInitiative(partyRoom, roomId, playerId, trigger, state).catch(
        (e) => console.error('[chatInitiativeTick] Agent initiative failed:', e)
      )
    }
  }
}

async function fireAgentInitiative(
  partyRoom: Party.Room,
  roomId: string,
  agentId: string,
  trigger: InitiativeTrigger,
  state: GameState
) {
  const { initiateAgentChat } = await import('./agent-manager')
  const { roomStore } = await import('../../lib/game/room-store')

  const room = await roomStore.get(roomId)
  if (!room) return

  const agent = room.players.get(agentId)
  if (!agent || !isAgentType(agent.type) || agent.isEliminated) return

  const zone = state.zones.get(agentId) ?? 'main'
  await initiateAgentChat(
    room,
    agent,
    zone,
    trigger,
    partyRoom,
    state.connToPlayer,
    state.zones,
    state,
    roomId
  )
}
