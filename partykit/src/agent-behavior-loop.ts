import type * as Party from 'partykit/server'
import type { Position } from '../../lib/game/types'
import { isAgentType } from '../../lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MOVE_SPEED,
  AGENT_TICK_MS,
  AGENT_WAYPOINT_JITTER_PX,
  AGENT_PATH_NOISE_PX,
  AGENT_WAYPOINT_ARRIVAL_PX,
  AGENT_CANVAS_MARGIN_PX,
  AGENT_IDLE_BASE_MS,
  AGENT_IDLE_JITTER_MS,
  AGENT_WANDER_IDLE_BASE_MS,
  AGENT_WANDER_IDLE_JITTER_MS,
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
} from '../../lib/game/constants'
import { ZONES } from '../../lib/game/zones'
import { PERSONAS } from '../../lib/game/agent-personas'
import { getPlayersInZone } from './proximity-router'
import { applyMove } from './movement-handler'
import type { GameState } from './game-state'

export function startAgentLoop(
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  stopAgentLoop(state)
  state.agentRoundStartedAt = Date.now()

  for (const [playerId] of state.positions) {
    const persona = PERSONAS.find((p) => p.id === playerId)
    if (!persona) continue
    state.agentMovement.set(playerId, {
      waypoint: null,
      waypointReachedAt: 0,
      nextIdleUntil:
        Date.now() + AGENT_IDLE_BASE_MS + Math.random() * AGENT_IDLE_JITTER_MS,
      targetZone: null,
      zoneDwellUntil: 0,
    })
  }

  const id = setInterval(() => {
    try {
      movementTick(partyRoom, state)
      chatInitiativeTick(partyRoom, roomId, state)
    } catch {
      // Prevent tick errors from crashing the Durable Object
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

// Fallback reference for stopAgentLoop calls without state (e.g., vote-manager)
let fallbackIntervalId: ReturnType<typeof setInterval> | null = null

// ─── Movement tick ──────────────────────────────────────────────────────────

function movementTick(partyRoom: Party.Room, state: GameState) {
  const now = Date.now()

  for (const [playerId, mvState] of state.agentMovement) {
    const persona = PERSONAS.find((p) => p.id === playerId)
    if (!persona) continue

    const currentPos = state.positions.get(playerId)
    if (!currentPos) continue

    const profile = persona.movement

    if (now < mvState.nextIdleUntil) continue

    if (mvState.targetZone && now < mvState.zoneDwellUntil) continue
    if (mvState.targetZone && now >= mvState.zoneDwellUntil) {
      mvState.targetZone = null
      mvState.waypoint = randomMainPosition()
    }

    if (!mvState.waypoint) {
      if (Math.random() < profile.idleChance) {
        mvState.nextIdleUntil =
          now +
          AGENT_WANDER_IDLE_BASE_MS +
          Math.random() * AGENT_WANDER_IDLE_JITTER_MS
        continue
      }

      if (Math.random() < profile.zoneExploreChance) {
        const available = ZONES.filter(
          (z) =>
            z.isPrivate &&
            getPlayersInZone(z.id, state.zones).length < z.capacity
        )
        if (available.length > 0) {
          const zone = available[Math.floor(Math.random() * available.length)]
          mvState.targetZone = zone.id
          const [minDwell, maxDwell] = profile.zoneDwellMs
          mvState.zoneDwellUntil =
            now + minDwell + Math.random() * (maxDwell - minDwell)
          mvState.waypoint = {
            x:
              zone.bounds.x +
              zone.bounds.width / 2 +
              (Math.random() - 0.5) * AGENT_WAYPOINT_JITTER_PX * 2,
            y:
              zone.bounds.y +
              zone.bounds.height / 2 +
              (Math.random() - 0.5) * AGENT_WAYPOINT_JITTER_PX * 2,
          }
        }
      }

      if (!mvState.waypoint) {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * profile.wanderRadius
        mvState.waypoint = {
          x: Math.max(
            AGENT_CANVAS_MARGIN_PX,
            Math.min(
              CANVAS_WIDTH - AGENT_CANVAS_MARGIN_PX,
              currentPos.x + Math.cos(angle) * dist
            )
          ),
          y: Math.max(
            AGENT_CANVAS_MARGIN_PX,
            Math.min(
              CANVAS_HEIGHT - AGENT_CANVAS_MARGIN_PX,
              currentPos.y + Math.sin(angle) * dist
            )
          ),
        }
      }
    }

    const dx = mvState.waypoint.x - currentPos.x
    const dy = mvState.waypoint.y - currentPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < AGENT_WAYPOINT_ARRIVAL_PX) {
      mvState.waypoint = null
      mvState.waypointReachedAt = now
      mvState.nextIdleUntil =
        now + AGENT_IDLE_BASE_MS + Math.random() * AGENT_IDLE_JITTER_MS
      continue
    }

    const speed = MOVE_SPEED * profile.speedFactor
    const step = Math.min(speed, dist)
    const nx = dx / dist
    const ny = dy / dist
    const noise = (Math.random() - 0.5) * AGENT_PATH_NOISE_PX * 2
    const newPos: Position = {
      x: currentPos.x + nx * step + -ny * noise,
      y: currentPos.y + ny * step + nx * noise,
    }

    applyMove(playerId, newPos, state, partyRoom)
  }
}

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

    let trigger:
      | 'topic_react'
      | 'zone_entry'
      | 'idle_chat'
      | 'meta_game'
      | null = null

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

    if (!trigger && Math.random() < AGENT_IDLE_CHAT_CHANCE) {
      trigger = 'idle_chat'
    }

    if (trigger) {
      state.agentChatCooldowns.set(playerId, now)
      fireAgentInitiative(partyRoom, roomId, playerId, trigger, state).catch(
        () => {}
      )
    }
  }
}

async function fireAgentInitiative(
  partyRoom: Party.Room,
  roomId: string,
  agentId: string,
  trigger: 'topic_react' | 'zone_entry' | 'idle_chat' | 'meta_game',
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
    state
  )
}

function randomMainPosition(): Position {
  const margin = AGENT_CANVAS_MARGIN_PX * 2
  return {
    x: margin + Math.random() * (CANVAS_WIDTH - margin * 2),
    y: margin + Math.random() * (CANVAS_HEIGHT - margin * 2),
  }
}
