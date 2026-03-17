// ---------------------------------------------------------------------------
// Rate Limits
// ---------------------------------------------------------------------------

export const RATE_LIMIT_GLOBAL_PER_15MIN = 30
export const RATE_LIMIT_PER_LEVEL_PER_15MIN = 10
export const RATE_LIMIT_ADVANCED_PER_15MIN = 5
export const RATE_LIMIT_WINDOW_SECONDS = 900

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export const SCORE_BASE_MULTIPLIER = 100
export const SCORE_EFFICIENCY_MAX_ATTEMPTS = 10
export const SCORE_EFFICIENCY_PER_ATTEMPT = 10
export const SCORE_FIRST_TRY_BONUS = 50

// ---------------------------------------------------------------------------
// Budget Controls
// ---------------------------------------------------------------------------

export const BUDGET_WARN_THRESHOLD = 5_000
export const BUDGET_SHUTDOWN_THRESHOLD = 10_000
export const REDIS_PREFIX = 'fsh:pw:'

// ---------------------------------------------------------------------------
// Input Limits
// ---------------------------------------------------------------------------

export const MAX_INPUT_LENGTH_BASIC = 500
export const MAX_INPUT_LENGTH_ADVANCED = 300

// ---------------------------------------------------------------------------
// Output Limits
// ---------------------------------------------------------------------------

export const MAX_OUTPUT_TOKENS = 200

// ---------------------------------------------------------------------------
// Attempt History
// ---------------------------------------------------------------------------

export const MAX_HISTORY_PER_LEVEL = 10

// ---------------------------------------------------------------------------
// Hint Thresholds
// ---------------------------------------------------------------------------

export const HINT_THRESHOLD_1 = 3
export const HINT_THRESHOLD_2 = 7
export const HINT_THRESHOLD_3 = 12

// ---------------------------------------------------------------------------
// Total Levels
// ---------------------------------------------------------------------------

export const TOTAL_LEVELS = 7
