import type { Position, ZoneType, GamePhase } from '../../lib/game/types'

export type GameState = {
  currentPhase: GamePhase
  positions: Map<string, Position>
  zones: Map<string, ZoneType>
  connToPlayer: Map<string, string>
  zoneWriteDebounce: Map<string, ReturnType<typeof setTimeout>>
  assignedColors: Set<number>
  playerColors: Map<string, number>
  displayNames: Map<string, string>
  sessionTokens: Map<string, string>
  chatTimestamps: Map<string, number[]>
}
