import type { Position, ZoneType, GamePhase } from '../../lib/game/types'

export type AgentMovementState = {
  waypoint: Position | null
  waypointReachedAt: number
  nextIdleUntil: number
  targetZone: ZoneType | null
  zoneDwellUntil: number
}

export type GameState = {
  currentPhase: GamePhase
  hostId: string | null
  positions: Map<string, Position>
  zones: Map<string, ZoneType>
  connToPlayer: Map<string, string>
  zoneWriteDebounce: Map<string, ReturnType<typeof setTimeout>>
  assignedColors: Set<number>
  playerColors: Map<string, number>
  displayNames: Map<string, string>
  sessionTokens: Map<string, string>
  chatTimestamps: Map<string, number[]>
  // Agent autonomous behavior
  agentMovement: Map<string, AgentMovementState>
  agentChatCooldowns: Map<string, number>
  zoneAgentMsgCount: Map<string, number>
  // Agent loop state (per-room, not module-level)
  agentIntervalId: ReturnType<typeof setInterval> | null
  agentRoundStartedAt: number
}
