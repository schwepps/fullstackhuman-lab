// --- Telegram API limits ---

/** Maximum text message length allowed by Telegram API */
export const TELEGRAM_MESSAGE_MAX_LENGTH = 4096

/** Maximum callback query data length (bytes) */
export const TELEGRAM_CALLBACK_DATA_MAX_BYTES = 64

// --- Rate limiting ---

/** Max messages per user per minute (prevents flooding) */
export const MAX_MESSAGES_PER_USER_PER_MINUTE = 10

/** Rate limit window for per-user messages */
export const USER_MESSAGE_WINDOW = '1 m' as const

/** Redis prefix for per-user message rate limiting */
export const RATE_LIMIT_PREFIX_USER_MESSAGE = 'ratelimit:telegram:user'

/** Max webhook requests per minute globally (circuit breaker) */
export const MAX_WEBHOOKS_PER_MINUTE = 100

/** Redis prefix for global circuit breaker */
export const RATE_LIMIT_PREFIX_GLOBAL = 'ratelimit:telegram:global'

/** In-memory rate limit window in ms (1 minute) */
export const USER_MESSAGE_WINDOW_MS = 60 * 1000

/** Max AI calls per user per day (prevents cost exhaustion) */
export const MAX_AI_CALLS_PER_USER_PER_DAY = 50

/** Redis prefix for per-user daily AI call limiting */
export const RATE_LIMIT_PREFIX_USER_DAILY = 'ratelimit:telegram:daily'

/** Daily rate limit window */
export const USER_DAILY_WINDOW = '1 d' as const

/** Daily rate limit window in ms (24 hours) */
export const USER_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000

// --- Callback query data prefixes ---

export const CALLBACK_PERSONA_PREFIX = 'persona:'

// --- Conversation state ---

/** TTL for active conversation state in Redis (24 hours) */
export const CONVERSATION_STATE_TTL_SECONDS = 24 * 60 * 60

/** Redis key prefix for active conversation state */
export const CONVERSATION_STATE_PREFIX = 'telegram:conv:'

// --- Webhook processing ---

/** Max time to wait for Claude API response before timeout (28s safety margin for 30s Vercel limit) */
export const AI_RESPONSE_TIMEOUT_MS = 28_000
