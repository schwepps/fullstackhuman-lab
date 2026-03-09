import type * as Party from 'partykit/server'
import type { Position } from '../../lib/game/types'
import { isAgentType } from '../../lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  AGENT_SPEED_PX_PER_TICK,
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

  let agentIndex = 0
  const agentCount = [...state.positions.keys()].filter((id) =>
    PERSONAS.some((p) => p.id === id)
  ).length

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

// Fallback reference for stopAgentLoop calls without state (e.g., vote-manager)
let fallbackIntervalId: ReturnType<typeof setInterval> | null = null

// ─── Movement tick ──────────────────────────────────────────────────────────

function movementTick(
  partyRoom: Party.Room,
  state: GameState,
  tickCounter: number
) {
  const now = Date.now()
  const agentCount = state.agentMovement.size

  // Cap stagger to 2 phases max — with many agents, N-phase stagger makes
  // each agent move only every N*100ms which is too slow for visible movement
  const staggerPhases = Math.min(agentCount, 2)

  for (const [playerId, mvState] of state.agentMovement) {
    // Stagger: distribute agents across 2 phases (even/odd ticks)
    if (
      staggerPhases > 1 &&
      tickCounter % staggerPhases !== mvState.tickPhase % staggerPhases
    )
      continue

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
      mvState.journeyStart = { x: currentPos.x, y: currentPos.y }
      const jdx = mvState.waypoint.x - currentPos.x
      const jdy = mvState.waypoint.y - currentPos.y
      mvState.journeyDist = Math.abs(jdx) + Math.abs(jdy) // Manhattan distance
      mvState.curveSign = Math.random() < 0.5 ? 1 : -1
      mvState.axisFirst = Math.random() < 0.5 ? 'x' : 'y'
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
        // Enforce minimum 40% of wander radius so movements are always visible
        const minDist = profile.wanderRadius * 0.4
        const dist = minDist + Math.random() * (profile.wanderRadius - minDist)
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

      // Record journey origin for sigmoid velocity calculation
      if (mvState.waypoint) {
        mvState.journeyStart = { x: currentPos.x, y: currentPos.y }
        const jdx = mvState.waypoint.x - currentPos.x
        const jdy = mvState.waypoint.y - currentPos.y
        mvState.journeyDist = Math.abs(jdx) + Math.abs(jdy) // Manhattan distance for axis-aligned
        mvState.curveSign = Math.random() < 0.5 ? 1 : -1
        mvState.axisFirst = Math.random() < 0.5 ? 'x' : 'y'
      }
    }

    const dx = mvState.waypoint.x - currentPos.x
    const dy = mvState.waypoint.y - currentPos.y
    const dist = Math.abs(dx) + Math.abs(dy) // Manhattan distance

    if (dist < AGENT_WAYPOINT_ARRIVAL_PX) {
      mvState.waypoint = null
      mvState.journeyStart = null
      mvState.waypointReachedAt = now
      mvState.nextIdleUntil =
        now + AGENT_IDLE_BASE_MS + Math.random() * AGENT_IDLE_JITTER_MS
      continue
    }

    // Sigmoid velocity: slow start → cruise → slow arrival
    const maxSpeed = AGENT_SPEED_PX_PER_TICK * profile.speedFactor
    const traveled = mvState.journeyDist - dist
    const progress =
      mvState.journeyDist > 0 ? traveled / mvState.journeyDist : 1
    const easeFactor = smoothPulse(progress)
    const speed = maxSpeed * (0.2 + 0.8 * easeFactor)
    const step = Math.min(speed, dist)

    // Axis-aligned movement: move along one axis at a time (like WASD/arrows)
    // First close the primary axis gap, then the secondary
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    let moveX = 0
    let moveY = 0

    const primaryAxis = mvState.axisFirst
    const primaryDone =
      primaryAxis === 'x'
        ? absDx < AGENT_WAYPOINT_ARRIVAL_PX
        : absDy < AGENT_WAYPOINT_ARRIVAL_PX

    if (!primaryDone) {
      // Move along primary axis
      if (primaryAxis === 'x') {
        moveX = Math.sign(dx) * step
      } else {
        moveY = Math.sign(dy) * step
      }
    } else {
      // Primary axis done, move along secondary
      if (primaryAxis === 'x') {
        moveY = Math.sign(dy) * step
      } else {
        moveX = Math.sign(dx) * step
      }
    }

    // Tiny perpendicular wobble to avoid perfectly rigid lines
    const noise = (Math.random() - 0.5) * AGENT_PATH_NOISE_PX
    const newPos: Position = {
      x: currentPos.x + moveX + (moveY !== 0 ? noise : 0),
      y: currentPos.y + moveY + (moveX !== 0 ? noise : 0),
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
        (e) => console.error('[chatInitiativeTick] Agent initiative failed:', e)
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

/** Smooth pulse: ramps up from 0, peaks mid-journey, ramps down to 0. Uses smoothstep. */
function smoothPulse(t: number): number {
  // Clamp to [0,1]
  const x = Math.max(0, Math.min(1, t))
  // Narrow easing edges so cruise phase dominates (85% of journey at full speed)
  const rise = smoothstep(0, 0.1, x)
  const fall = 1 - smoothstep(0.9, 1, x)
  return rise * fall
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function randomMainPosition(): Position {
  const margin = AGENT_CANVAS_MARGIN_PX * 2
  return {
    x: margin + Math.random() * (CANVAS_WIDTH - margin * 2),
    y: margin + Math.random() * (CANVAS_HEIGHT - margin * 2),
  }
}
