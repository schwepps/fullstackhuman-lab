// ---------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export interface Room {
  code: string
  creatorName: string
  creatorSessionId: string
  crime: string
  initialAccusation: string
  status: RoomStatus
  currentRound: number
  initialAccusedIndex: number | null
  skillId: string
  roundDeadline: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export interface Player {
  name: string
  sessionId: string
  joinedAt: string
}

// ---------------------------------------------------------------------------
// Round Messages
// ---------------------------------------------------------------------------

export interface RoundMessage {
  playerName: string
  sessionId: string
  prompt: string
  generatedContent: string
  targetName: string | null
  isDefense: boolean
  wordCount: number
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

export interface RoundVotes {
  [voterSessionId: string]: string // voted-for sessionId
}

// ---------------------------------------------------------------------------
// Guilt Scores
// ---------------------------------------------------------------------------

export interface GuiltScore {
  playerName: string
  sessionId: string
  guiltScore: number // 0-100
  reasoning: string
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

export interface FinalVerdict {
  convictName: string
  convictSessionId: string
  crime: string
  sentence: string
  explanation: string
  scores: GuiltScore[]
  resultId: string
}

// ---------------------------------------------------------------------------
// Shareable Result
// ---------------------------------------------------------------------------

export interface ShareableResult {
  id: string
  roomCode: string
  convictName: string
  crime: string
  sentence: string
  explanation: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// AI Skill
// ---------------------------------------------------------------------------

export interface AISkill {
  id: string
  name: string
  tip: string
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  isValid: boolean
  wordCount: number
  reason?: string
}

// ---------------------------------------------------------------------------
// Room State (full snapshot for client)
// ---------------------------------------------------------------------------

export interface RoomState {
  room: Room
  players: Player[]
  currentRoundMessages: RoundMessage[]
  currentRoundVotes: RoundVotes
  scores: GuiltScore[]
  verdict: FinalVerdict | null
  aiTip: string | null
}
