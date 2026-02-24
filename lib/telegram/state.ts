import { getRedisClient } from '@/lib/upstash'
import { getActiveConversation } from '@/lib/telegram/services/conversation-service'
import { assemblePrompt } from '@/lib/telegram/services/ai-service'
import {
  CONVERSATION_STATE_PREFIX,
  CONVERSATION_STATE_TTL_SECONDS,
} from '@/lib/telegram/constants'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import type { TelegramConversationState } from '@/lib/telegram/types'

/**
 * In-memory fallback for when Redis is unavailable (local dev).
 * Not shared across serverless instances — acceptable for MVP.
 */
const memoryStore = new Map<number, TelegramConversationState>()

function redisKey(chatId: number): string {
  return `${CONVERSATION_STATE_PREFIX}${chatId}`
}

/**
 * Retrieve active conversation state for a Telegram chat.
 *
 * Resolution order:
 * 1. Redis (primary)
 * 2. In-memory fallback
 * 3. DB reconstruction (re-assembles system prompt if found)
 */
export async function getConversationState(
  chatId: number
): Promise<TelegramConversationState | null> {
  // Try Redis first
  try {
    const redis = getRedisClient()
    const raw = await redis.get<TelegramConversationState>(redisKey(chatId))
    if (raw) return raw
  } catch {
    // Redis unavailable — fall through
  }

  // Try in-memory fallback
  const cached = memoryStore.get(chatId)
  if (cached) return cached

  // Try DB reconstruction
  try {
    const conversation = await getActiveConversation(chatId)
    if (!conversation) return null

    const systemPrompt = await assemblePrompt(conversation.persona)
    const state: TelegramConversationState = {
      conversationId: conversation.id,
      persona: conversation.persona,
      systemPrompt,
      telegramUserId: conversation.telegram_user_id,
    }

    // Cache reconstructed state
    await setConversationState(chatId, state)
    return state
  } catch (error) {
    log('error', LOG_EVENT.TELEGRAM_STATE_RECONSTRUCT_FAILED, {
      chatId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

/**
 * Store conversation state in Redis (with TTL) and in-memory fallback.
 */
export async function setConversationState(
  chatId: number,
  state: TelegramConversationState
): Promise<void> {
  // Always update in-memory fallback
  memoryStore.set(chatId, state)

  // Try Redis
  try {
    const redis = getRedisClient()
    await redis.set(redisKey(chatId), state, {
      ex: CONVERSATION_STATE_TTL_SECONDS,
    })
  } catch {
    // Redis unavailable — in-memory fallback is already set
  }
}

/**
 * Clear conversation state from both Redis and in-memory.
 */
export async function clearConversationState(chatId: number): Promise<void> {
  memoryStore.delete(chatId)

  try {
    const redis = getRedisClient()
    await redis.del(redisKey(chatId))
  } catch {
    // Redis unavailable — in-memory already cleared
  }
}
