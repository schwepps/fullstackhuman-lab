import type { PersonaId, ChatMessage } from '@/types/chat'

// --- Conversation status ---

export const CONVERSATION_STATUSES = [
  'active',
  'completed',
  'abandoned',
] as const

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number]

// --- Conversation types ---

export interface Conversation {
  readonly id: string
  readonly userId: string
  readonly persona: PersonaId
  readonly title: string | null
  readonly messages: ChatMessage[]
  readonly hasReport: boolean
  readonly status: ConversationStatus
  readonly messageCount: number
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ConversationSummary {
  readonly id: string
  readonly persona: PersonaId
  readonly title: string | null
  readonly hasReport: boolean
  readonly status: ConversationStatus
  readonly messageCount: number
  readonly createdAt: string
  readonly updatedAt: string
}
