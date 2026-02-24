import {
  createTelegramConversation,
  getActiveTelegramConversation,
  updateTelegramConversationMessages,
  abandonTelegramConversation,
} from '@/lib/telegram/db'
import type { PersonaId, ChatMessage } from '@/types/chat'
import type { TelegramConversationRow } from '@/lib/telegram/types'

const TITLE_MAX_LENGTH = 200

/**
 * Start a new conversation for a Telegram chat.
 * Returns the conversation ID or null on failure.
 */
export async function startConversation(params: {
  telegramUserId: string
  telegramChatId: number
  persona: PersonaId
}): Promise<string | null> {
  return createTelegramConversation(params)
}

/**
 * Get the most recent active conversation for a Telegram chat.
 */
export async function getActiveConversation(
  telegramChatId: number
): Promise<TelegramConversationRow | null> {
  return getActiveTelegramConversation(telegramChatId)
}

/**
 * Save messages to an existing conversation.
 * Marks as completed if it contains a report.
 */
export async function saveMessages(params: {
  conversationId: string
  messages: ChatMessage[]
  hasReport: boolean
  title: string | null
}): Promise<boolean> {
  return updateTelegramConversationMessages(params)
}

/**
 * Abandon an active conversation (mark as abandoned).
 */
export async function abandonConversation(
  conversationId: string
): Promise<boolean> {
  return abandonTelegramConversation(conversationId)
}

/**
 * Extract a title from the first user message in a conversation.
 * Takes first 200 chars and adds ellipsis if truncated.
 * Returns null if no user message is found.
 */
export function extractTitle(messages: ChatMessage[]): string | null {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (!firstUserMessage) return null

  const content = firstUserMessage.content.trim()
  if (!content.length) return null
  if (content.length <= TITLE_MAX_LENGTH) return content
  return content.slice(0, TITLE_MAX_LENGTH - 1) + '\u2026'
}
