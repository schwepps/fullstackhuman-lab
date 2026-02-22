// --- Persona types ---

export type PersonaId = 'doctor' | 'critic' | 'guide'

export interface PersonaConfig {
  readonly id: PersonaId
  readonly emoji: string
  readonly reportDetectPattern: RegExp
  readonly promptFile: string
}

// --- Message types ---

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly isReport: boolean
  readonly timestamp: number
}

// --- Chat state ---

export type ChatPhase = 'selection' | 'chatting'

export interface ChatState {
  readonly phase: ChatPhase
  readonly persona: PersonaId | null
  readonly messages: ChatMessage[]
  readonly isStreaming: boolean
  readonly error: string | null
  readonly conversationId: string | null
  readonly isReadOnly: boolean
}
