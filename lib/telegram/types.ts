import type { PersonaId, ChatMessage } from '@/types/chat'

// --- Database row types ---

export interface TelegramUserRow {
  readonly id: string
  readonly telegram_id: number
  readonly language_code: string
  readonly tier: string
  readonly conversation_count_month: number
  readonly conversation_count_reset_at: string
  readonly created_at: string
  readonly last_active_at: string
}

export interface TelegramConversationRow {
  readonly id: string
  readonly telegram_user_id: string
  readonly telegram_chat_id: number
  readonly persona: PersonaId
  readonly title: string | null
  readonly messages: ChatMessage[]
  readonly has_report: boolean
  readonly status: TelegramConversationStatus
  readonly message_count: number
  readonly created_at: string
  readonly updated_at: string
}

export type TelegramConversationStatus = 'active' | 'completed' | 'abandoned'

// --- Active conversation state (Redis/in-memory) ---

export interface TelegramConversationState {
  readonly conversationId: string
  readonly persona: PersonaId
  readonly telegramUserId: string
}

// --- Supported language codes ---

export type TelegramLanguage = 'fr' | 'en'
