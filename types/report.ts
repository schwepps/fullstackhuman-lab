import type { PersonaId } from '@/types/chat'

// --- Application model (camelCase) ---

export interface Report {
  readonly id: string
  readonly conversationId: string
  readonly persona: PersonaId
  readonly content: string
  readonly shareToken: string
  readonly isBranded: boolean
  readonly createdAt: string
}

// --- Database row shape (snake_case from Supabase) ---

export interface ReportRow {
  id: string
  conversation_id: string
  persona: PersonaId
  content: string
  share_token: string
  is_branded: boolean
  created_at: string
}
