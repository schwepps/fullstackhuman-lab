import {
  createLazyRateLimiter,
  consumeWithFallback,
} from '@/lib/rate-limit-utils'
import { consumeTelegramConversation } from '@/lib/telegram/db'
import {
  MAX_MESSAGES_PER_USER_PER_MINUTE,
  RATE_LIMIT_PREFIX_USER_MESSAGE,
  USER_MESSAGE_WINDOW,
  USER_MESSAGE_WINDOW_MS,
  RATE_LIMIT_PREFIX_GLOBAL,
  MAX_WEBHOOKS_PER_MINUTE,
  MAX_AI_CALLS_PER_USER_PER_DAY,
  RATE_LIMIT_PREFIX_USER_DAILY,
  USER_DAILY_WINDOW,
  USER_DAILY_WINDOW_MS,
} from '@/lib/telegram/constants'

const GLOBAL_WINDOW = '1 m' as const
const GLOBAL_WINDOW_MS = 60 * 1000

// --- Per-user message rate limiting ---

const getUserLimiter = createLazyRateLimiter({
  maxRequests: MAX_MESSAGES_PER_USER_PER_MINUTE,
  window: USER_MESSAGE_WINDOW,
  prefix: RATE_LIMIT_PREFIX_USER_MESSAGE,
})

const userFallbackMap = new Map<string, number[]>()

/**
 * Check per-user message rate limit.
 * Uses Redis when available, falls back to in-memory Map.
 * Returns true if the message is allowed.
 */
export async function checkMessageRateLimit(
  telegramId: number
): Promise<boolean> {
  const key = String(telegramId)
  return consumeWithFallback(
    getUserLimiter(),
    key,
    userFallbackMap,
    USER_MESSAGE_WINDOW_MS,
    MAX_MESSAGES_PER_USER_PER_MINUTE
  )
}

// --- Global circuit breaker ---

const getGlobalLimiter = createLazyRateLimiter({
  maxRequests: MAX_WEBHOOKS_PER_MINUTE,
  window: GLOBAL_WINDOW,
  prefix: RATE_LIMIT_PREFIX_GLOBAL,
})

const globalFallbackMap = new Map<string, number[]>()
const GLOBAL_KEY = 'global'

/**
 * Check global webhook rate limit (circuit breaker).
 * Uses Redis when available, falls back to in-memory Map.
 * Returns true if the request is allowed.
 */
export async function checkGlobalRateLimit(): Promise<boolean> {
  return consumeWithFallback(
    getGlobalLimiter(),
    GLOBAL_KEY,
    globalFallbackMap,
    GLOBAL_WINDOW_MS,
    MAX_WEBHOOKS_PER_MINUTE
  )
}

// --- Per-user daily AI call limiting ---

const getDailyLimiter = createLazyRateLimiter({
  maxRequests: MAX_AI_CALLS_PER_USER_PER_DAY,
  window: USER_DAILY_WINDOW,
  prefix: RATE_LIMIT_PREFIX_USER_DAILY,
})

const dailyFallbackMap = new Map<string, number[]>()

/**
 * Check per-user daily AI call limit.
 * Prevents cost exhaustion from users sending many messages across conversations.
 * Returns true if the call is allowed.
 */
export async function checkDailyAiCallLimit(
  telegramId: number
): Promise<boolean> {
  const key = String(telegramId)
  return consumeWithFallback(
    getDailyLimiter(),
    key,
    dailyFallbackMap,
    USER_DAILY_WINDOW_MS,
    MAX_AI_CALLS_PER_USER_PER_DAY
  )
}

// --- Conversation quota ---

/**
 * Consume a conversation quota for a Telegram user.
 * Delegates to the DB RPC function that atomically checks and increments.
 */
export async function consumeConversation(
  telegramUserId: string
): Promise<{ allowed: boolean }> {
  return consumeTelegramConversation(telegramUserId)
}
