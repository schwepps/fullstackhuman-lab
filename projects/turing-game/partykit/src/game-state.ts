import type { Position, ZoneType, GamePhase } from '../../lib/game/types'

export type AgentLogEntry = {
  content: string
  zone: ZoneType
}

export type AgentMood =
  | 'neutral'
  | 'engaged'
  | 'amused'
  | 'frustrated'
  | 'suspicious'
  | 'defensive'
  | 'bored'

export type AgentEmotionalState = {
  mood: AgentMood
  trigger: string
  since: number
}

export type AgentMovementState = {
  waypoint: Position | null
  waypointReachedAt: number
  nextIdleUntil: number
  targetZone: ZoneType | null
  zoneDwellUntil: number
  // Per-agent tick offset — stagger so agents don't all move at once
  tickPhase: number
  journeyDist: number
  // Axis-aligned movement: 'x' = horizontal first, 'y' = vertical first
  axisFirst: 'x' | 'y'
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
  chatTimestamps: Map<string, number[]>
  // Agent autonomous behavior
  agentMovement: Map<string, AgentMovementState>
  agentChatCooldowns: Map<string, number>
  zoneAgentMsgCount: Map<string, number>
  // Agent loop state (per-room, not module-level)
  agentIntervalId: ReturnType<typeof setInterval> | null
  agentRoundStartedAt: number
  // Fallback timer when Durable Object alarms are unavailable
  alarmFallbackTimer: ReturnType<typeof setTimeout> | null
  // Late joiners who can only watch
  spectators: Set<string>
  // Players eliminated during voting — blocked from chat/vote/move
  eliminatedPlayers: Set<string>
  // Vote phase guards — reset when a vote phase opens
  isVoteResolved: boolean
  hasRequestedAgentVotes: boolean
  // Set while the host's start request is in flight
  isStarting: boolean
  // Client IP per player, for the room creation limit
  playerIps: Map<string, string>
  // Agent collective memory — tracks what each bot has said (content + zone)
  agentMessageLog: Map<string, AgentLogEntry[]>
  // Agent emotional state — evolves based on game events and time
  agentEmotions: Map<string, AgentEmotionalState>
  // API call timestamps for room-level budget tracking (sliding window)
  apiCallTimestamps: number[]
}
