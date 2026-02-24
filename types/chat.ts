// --- Persona types ---

export type PersonaId = 'doctor' | 'critic' | 'guide'

export interface PersonaConfig {
  readonly id: PersonaId
  readonly reportDetectPattern: RegExp
  readonly promptFile: string
}

// --- File attachment types ---

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
  'text/csv',
] as const

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number]

export interface FileAttachmentMeta {
  readonly id: string
  readonly name: string
  readonly type: AllowedFileType
  readonly size: number // bytes
}

export interface FileAttachment extends FileAttachmentMeta {
  readonly data: string // base64-encoded — ephemeral, NOT persisted
}

// --- Message types ---

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly isReport: boolean
  readonly timestamp: number
  readonly attachments?: FileAttachmentMeta[]
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
  readonly shareToken: string | null
}
