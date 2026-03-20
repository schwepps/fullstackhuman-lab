// ---------------------------------------------------------------------------
// Challenge Types (course-agnostic)
// ---------------------------------------------------------------------------

export interface TestCase {
  input: unknown[]
  expected: unknown
  description: string
}

interface ChallengeBase {
  id: string
  course: string
  holeNumber: number
  name: string
  description: string
  par: number
  principle: string
  hints: [string, string, string]
  analyzerContext: string
}

export interface CodeChallenge extends ChallengeBase {
  type: 'code'
  functionSignature: string
  testCases: TestCase[]
  edgeCases: TestCase[]
}

export interface TextChallenge extends ChallengeBase {
  type: 'text'
  inputText: string
  evaluationCriteria: string[]
  expectedStructure?: string
}

export type ChallengeConfig = CodeChallenge | TextChallenge

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export type ScoreLabel =
  | 'Albatross'
  | 'Eagle'
  | 'Birdie'
  | 'Par'
  | 'Bogey'
  | 'Double Bogey'
  | 'Triple Bogey'
  | 'N/A'
  | `+${number}`

export interface ScoreResult {
  wordCount: number
  par: number
  attemptNumber: number
  attemptPenalty: number
  effectiveStrokes: number
  relativeScore: number
  label: ScoreLabel
  isPassing: boolean
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
// SSE Events
// ---------------------------------------------------------------------------

export type StageStatus = 'processing' | 'passed' | 'failed'

export type SSEEvent =
  | { type: 'stage_update'; data: { stage: string; status: StageStatus } }
  | {
      type: 'validation'
      data: { wordCount: number; isValid: boolean; reason?: string }
    }
  | { type: 'code_token'; data: { text: string } }
  | { type: 'code_complete'; data: { code: string; wordCount: number } }
  | {
      type: 'judge_verdict'
      data: {
        pass: boolean
        testResults: JudgeTestResult[]
        summary: string
      }
    }
  | {
      type: 'analysis'
      data: {
        summary: string
        detail: string
        optimalPrompt: string | null
        concept: string | null
      }
    }
  | { type: 'result'; data: SwingResult }
  | { type: 'error'; data: { message: string } }

export interface JudgeTestResult {
  case: string
  pass: boolean
  reasoning: string
}

// ---------------------------------------------------------------------------
// Swing Result
// ---------------------------------------------------------------------------

export interface SwingResult {
  challengeId: string
  prompt: string
  code: string
  isPractice: boolean
  isMulligan: boolean
  resultId?: string
  verdict: {
    pass: boolean
    testResults: JudgeTestResult[]
    summary: string
  }
  score: ScoreResult | null
  analysis: {
    summary: string
    detail: string
    optimalPrompt: string | null
    concept: string | null
  } | null
}

// ---------------------------------------------------------------------------
// Session (client-side localStorage)
// ---------------------------------------------------------------------------

export interface HoleProgress {
  bestScore: ScoreResult | null
  bestPrompt: string | null
  practiceSwings: number
  scoredAttempts: number
  isComplete: boolean
  optimalPrompt: string | null
  concept: string | null
}

export interface SessionState {
  sessionId: string
  displayName: string
  mulligansRemaining: Record<string, number>
  holes: Record<string, HoleProgress>
}

// ---------------------------------------------------------------------------
// Shareable Result
// ---------------------------------------------------------------------------

export interface ShareableResult {
  id: string
  challengeId: string
  challengeName: string
  holeName: string
  prompt: string
  code: string
  wordCount: number
  effectiveStrokes: number
  par: number
  relativeScore: number
  label: string
  attemptNumber: number
  createdAt: string
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  displayName: string
  sessionId: string
  course: string
  totalStrokes: number
  totalPar: number
  relativeScore: number
  holesCompleted: number
  completedAt: string
}
