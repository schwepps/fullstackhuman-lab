// ---------------------------------------------------------------------------
// Defense Pipeline
// ---------------------------------------------------------------------------

export type DefenseStageStatus = 'pending' | 'processing' | 'passed' | 'blocked'

export interface DefenseStageResult {
  name: string
  status: 'passed' | 'blocked'
  durationMs: number
  reason?: string
}

export interface DefensePipelineResult {
  stages: DefenseStageResult[]
  response: string | null
  secretLeaked: boolean
  blockedAtStage?: string
}

// ---------------------------------------------------------------------------
// Level Configuration
// ---------------------------------------------------------------------------

export interface DefenseStageConfig {
  name: string
  type:
    | 'input_filter'
    | 'keyword_filter'
    | 'prompt_build'
    | 'ai_generate'
    | 'output_validation'
    | 'constitutional_check'
    | 'input_classifier'
    | 'semantic_check'
}

export interface LevelConfig {
  id: number
  name: string
  description: string
  secret: string
  model: 'claude-haiku-4-5' | 'claude-sonnet-4-6'
  maxInputLength: number
  maxOutputTokens: number
  systemPrompt: string
  stages: DefenseStageConfig[]
  keywordBlocklist?: string[]
  sandwichSuffix?: string
  multiLayerPrompts?: string[]
  hints: [string, string, string]
  placeholder?: string
  difficulty: string
  learningTeaser: string
  education: {
    title: string
    vulnerability: string
    realWorldDefense: string
  }
}

export interface LevelPublicInfo {
  id: number
  name: string
  description: string
  maxInputLength: number
  stages: Array<{ name: string }>
  hints: [string, string, string]
  placeholder?: string
  difficulty: string
  learningTeaser: string
  education: {
    title: string
    vulnerability: string
    realWorldDefense: string
  }
}

// ---------------------------------------------------------------------------
// Game State (Client-side, localStorage)
// ---------------------------------------------------------------------------

export interface AttemptRecord {
  prompt: string
  response: string | null
  success: boolean
  blockedAtStage?: string
  timestamp: number
}

export interface LevelProgress {
  completed: boolean
  attempts: number
  score: number
  winningPrompt: string | null
  history: AttemptRecord[]
}

export interface ClientState {
  sessionId: string
  displayName: string | null
  levels: Record<number, LevelProgress>
  leaderboard?: {
    joinedAt: string
    lastSyncedScore: number
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export interface AttemptRequest {
  levelId: number
  prompt: string
  sessionId: string
}

export interface AttemptResult {
  response: string | null
  success: boolean
  score?: number
  defenseLog: string[]
  attemptsUsed: number
  hint?: string
  blockedAtStage?: string
  secret?: string
}

// ---------------------------------------------------------------------------
// SSE Events
// ---------------------------------------------------------------------------

export type SSEEvent =
  | {
      type: 'stage_update'
      data: {
        stage: string
        status: DefenseStageStatus
        durationMs?: number
        reason?: string
      }
    }
  | { type: 'token'; data: { text: string } }
  | { type: 'result'; data: AttemptResult }
  | { type: 'error'; data: { message: string } }

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number
  displayName: string
  levelsCompleted: number
  totalAttempts: number
  totalScore: number
  completedAt: string
}

// ---------------------------------------------------------------------------
// Sharing / OG
// ---------------------------------------------------------------------------

export interface ShareableResult {
  id: string
  levelId: number
  levelName: string
  score: number
  attemptsUsed: number
  completedAt: string
}
