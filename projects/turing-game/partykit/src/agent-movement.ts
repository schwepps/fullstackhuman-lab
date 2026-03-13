import type * as Party from 'partykit/server'
import type { Position } from '../../lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  AGENT_SPEED_PX_PER_TICK,
  AGENT_WAYPOINT_JITTER_PX,
  AGENT_PATH_NOISE_PX,
  AGENT_WAYPOINT_ARRIVAL_PX,
  AGENT_CANVAS_MARGIN_PX,
  AGENT_IDLE_BASE_MS,
  AGENT_IDLE_JITTER_MS,
  AGENT_WANDER_IDLE_BASE_MS,
  AGENT_WANDER_IDLE_JITTER_MS,
} from '../../lib/game/constants'
import { ZONES } from '../../lib/game/zones'
import { PERSONAS } from '../../lib/game/agent-personas'
import { getPlayersInZone } from './proximity-router'
import { applyMove } from './movement-handler'
import type { GameState } from './game-state'

export function movementTick(
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
      mvState.journeyDist = Math.abs(jdx) + Math.abs(jdy)
      mvState.curveSign = Math.random() < 0.5 ? 1 : -1
      mvState.axisFirst = Math.random() < 0.5 ? 'x' : 'y'
    }

    if (!mvState.waypoint) {
      selectWaypoint(mvState, currentPos, profile, state, now)
      const wp = mvState.waypoint as Position | null
      if (!wp) continue

      // Record journey origin for sigmoid velocity calculation
      mvState.journeyStart = { x: currentPos.x, y: currentPos.y }
      const jdx = wp.x - currentPos.x
      const jdy = wp.y - currentPos.y
      mvState.journeyDist = Math.abs(jdx) + Math.abs(jdy)
      mvState.curveSign = Math.random() < 0.5 ? 1 : -1
      mvState.axisFirst = Math.random() < 0.5 ? 'x' : 'y'
    }

    const moved = calculateMovement(mvState, currentPos, profile, now)
    if (!moved) continue

    applyMove(playerId, moved, state, partyRoom)
  }
}

function selectWaypoint(
  mvState: GameState['agentMovement'] extends Map<string, infer V> ? V : never,
  currentPos: Position,
  profile: {
    idleChance: number
    zoneExploreChance: number
    wanderRadius: number
    zoneDwellMs: [number, number]
  },
  state: GameState,
  now: number
) {
  if (Math.random() < profile.idleChance) {
    mvState.nextIdleUntil =
      now +
      AGENT_WANDER_IDLE_BASE_MS +
      Math.random() * AGENT_WANDER_IDLE_JITTER_MS
    return
  }

  if (Math.random() < profile.zoneExploreChance) {
    const available = ZONES.filter(
      (z) =>
        z.isPrivate && getPlayersInZone(z.id, state.zones).length < z.capacity
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
      return
    }
  }

  const angle = Math.random() * Math.PI * 2
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

function calculateMovement(
  mvState: GameState['agentMovement'] extends Map<string, infer V> ? V : never,
  currentPos: Position,
  profile: { speedFactor: number },
  now: number
): Position | null {
  if (!mvState.waypoint) return null

  const dx = mvState.waypoint.x - currentPos.x
  const dy = mvState.waypoint.y - currentPos.y
  const dist = Math.abs(dx) + Math.abs(dy)

  if (dist < AGENT_WAYPOINT_ARRIVAL_PX) {
    mvState.waypoint = null
    mvState.journeyStart = null
    mvState.waypointReachedAt = now
    mvState.nextIdleUntil =
      now + AGENT_IDLE_BASE_MS + Math.random() * AGENT_IDLE_JITTER_MS
    return null
  }

  // Sigmoid velocity: slow start → cruise → slow arrival
  const maxSpeed = AGENT_SPEED_PX_PER_TICK * profile.speedFactor
  const traveled = mvState.journeyDist - dist
  const progress = mvState.journeyDist > 0 ? traveled / mvState.journeyDist : 1
  const easeFactor = smoothPulse(progress)
  const speed = maxSpeed * (0.2 + 0.8 * easeFactor)
  const step = Math.min(speed, dist)

  // Axis-aligned movement: move along one axis at a time
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
    if (primaryAxis === 'x') {
      moveX = Math.sign(dx) * step
    } else {
      moveY = Math.sign(dy) * step
    }
  } else {
    if (primaryAxis === 'x') {
      moveY = Math.sign(dy) * step
    } else {
      moveX = Math.sign(dx) * step
    }
  }

  // Tiny perpendicular wobble to avoid perfectly rigid lines
  const noise = (Math.random() - 0.5) * AGENT_PATH_NOISE_PX
  return {
    x: currentPos.x + moveX + (moveY !== 0 ? noise : 0),
    y: currentPos.y + moveY + (moveX !== 0 ? noise : 0),
  }
}

function smoothPulse(t: number): number {
  const x = Math.max(0, Math.min(1, t))
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
