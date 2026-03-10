// ─── Core enums ───────────────────────────────────────────────────────────────

export type PlayerType = 'human' | 'custom-agent' | 'auto-agent' | 'spectator'

export function isAgentType(type: PlayerType): boolean {
  return type === 'auto-agent' || type === 'custom-agent'
}
export type GamePhase =
  | 'lobby'
  | 'round'
  | 'vote'
  | 'elimination'
  | 'reveal'
  | 'ended'
export type RevealPreference = 'public' | 'private' | 'leaderboard'
export type SupportedModel = 'claude-sonnet-4-6' | 'claude-haiku-4-5'
export type ZoneType =
  | 'main'
  | 'private-a'
  | 'private-b'
  | 'private-c'
  | 'whisper'
export type ChatScope = ZoneType

// ─── Spatial types ────────────────────────────────────────────────────────────

export interface Position {
  x: number
  y: number
}

export interface Zone {
  id: ZoneType
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  capacity: number
  isPrivate: boolean
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string
  displayName: string
  type: PlayerType
  customPrompt?: string
  model: SupportedModel
  revealPreference: RevealPreference
  position: Position
  currentZone: ZoneType
  avatarColor: number
  isConnected: boolean
  isEliminated: boolean
  score: number
  roundsSurvived: number
  correctVotes: number
  votedFor?: string
  sessionToken: string
  chatHistory: ZoneChatEntry[]
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  playerId: string
  displayName: string
  content: string
  zone: ChatScope
  timestamp: number
  isStreaming?: boolean
}

export interface ZoneChatEntry {
  zone: ZoneType
  messages: ChatMessage[]
}

// ─── Room ─────────────────────────────────────────────────────────────────────

export interface Room {
  id: string
  hostId: string
  phase: GamePhase
  round: number
  maxRounds: number
  roundDuration: number
  currentTopic?: string
  players: Map<string, Player>
  votes: Map<string, string>
  roundResults: RoundResult[]
  createdAt: number
  roundStartedAt?: number
  results?: GameResult
}

export interface RoundResult {
  round: number
  topic: string
  eliminatedPlayerId: string
  eliminatedDisplayName: string
  voteBreakdown: Record<string, number>
}

// ─── End game ─────────────────────────────────────────────────────────────────

export interface GameResult {
  wasAllHumans: boolean
  wasAllAgents: boolean
  agentsSurvived: string[]
  agentsCaught: string[]
  humansEliminated: string[]
  scores: Record<string, number>
  promptReveal: PromptRevealEntry[]
}

export interface PromptRevealEntry {
  playerId: string
  displayName: string
  prompt: string
  humanityScore: number
  roundsSurvived: number
  totalRounds: number
  votesReceivedPerRound: number[]
}

// ─── Partykit WebSocket message types ─────────────────────────────────────────

export type ClientMessage =
  | { type: 'move'; position: Position }
  | { type: 'move-to'; target: Position }
  | { type: 'chat'; content: string; zone: ChatScope }
  | { type: 'vote'; targetId: string }
  | { type: 'ready' }

export type ServerMessage =
  | { type: 'player_joined'; player: PublicPlayer }
  | { type: 'player_left'; playerId: string }
  | { type: 'position_update'; updates: PositionUpdate[] }
  | { type: 'zone_update'; playerId: string; zone: ZoneType }
  | { type: 'chat_message'; message: ChatMessage }
  | {
      type: 'agent_typing'
      playerId: string
      displayName: string
      zone: ZoneType
      isTyping: boolean
    }
  | {
      type: 'phase_change'
      phase: GamePhase
      round?: number
      topic?: string
      sessionToken?: string
      yourPlayerId?: string
      yourDisplayName?: string
      yourColor?: number
      isHost?: boolean
      isSpectator?: boolean
      roundStartedAt?: number
      roundDuration?: number
    }
  | { type: 'vote_progress'; count: number; total: number }
  | { type: 'elimination'; playerId: string; displayName: string }
  | { type: 'reveal'; result: GameResult; allPlayers: RevealPlayer[] }
  | { type: 'score_update'; scores: Record<string, number> }
  | { type: 'message_removed'; messageId: string; reason: string }
  | {
      type: 'reconnected'
      phase: GamePhase
      round: number
      topic?: string
      yourPlayerId: string
      yourColor: number
      roundStartedAt?: number
    }

export type PublicPlayer = Omit<Player, 'type' | 'customPrompt' | 'chatHistory'>

export interface PositionUpdate {
  playerId: string
  position: Position
  zone: ZoneType
}

export type RevealPlayer = Omit<PublicPlayer, 'sessionToken'> & {
  type: PlayerType
  customPrompt?: string
}

// ─── Client-side shared types ────────────────────────────────────────────────

export type LobbyPlayer = {
  id: string
  displayName: string
  avatarColor: number
}

export type TypingPlayer = {
  playerId: string
  displayName: string
}

export type TypingState = TypingPlayer & {
  zone: ZoneType
  startedAt: number
}

export type StoredSession = {
  playerId: string
  sessionToken: string
}

// ─── Agent types (for later phases) ──────────────────────────────────────────

export interface MovementProfile {
  wanderRadius: number
  idleChance: number
  zoneExploreChance: number
  zoneDwellMs: [number, number]
  speedFactor: number
}

export interface AgentPersona {
  id: string
  name: string
  age: number
  styleNotes: string
  quirks: string[]
  opinions: string[]
  movement: MovementProfile
  typoRate: number
  casualness: 'low' | 'medium' | 'high'
}

export interface TypingProfile {
  wpm: number
  thinkingMs: [number, number]
}
