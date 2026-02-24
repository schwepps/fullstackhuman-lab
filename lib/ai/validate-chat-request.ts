import {
  detectSuspiciousInput,
  type SuspiciousInputResult,
} from '@/lib/ai/sanitize'
import { PERSONA_IDS } from '@/lib/constants/personas'
import {
  MAX_MESSAGES_PER_REQUEST,
  MAX_TRIGGER_LENGTH,
  CHAT_INPUT_MAX_LENGTH,
  MAX_MESSAGE_LENGTH,
  VALID_MESSAGE_ROLES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_MESSAGE,
  MAX_FILE_NAME_LENGTH,
} from '@/lib/constants/chat'
import { type AllowedFileType, type PersonaId } from '@/types/chat'
import { isAllowedFileType } from '@/lib/files/validate'

// --- Constants ---

/** Max base64 string length for MAX_FILE_SIZE_BYTES (base64 expands ~4/3) */
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_SIZE_BYTES / 3) * 4

/** Base64 format: alphanumeric, +, /, optional trailing = padding */
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/

/** File name allowlist: letters, digits, dots, hyphens, underscores, spaces */
const SAFE_FILE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._\- ]*$/

/**
 * Magic byte prefixes for each MIME type (base64-encoded).
 * Used to verify the actual content matches the declared type.
 */
const MAGIC_BYTE_PREFIXES: Partial<Record<AllowedFileType, string[]>> = {
  'application/pdf': ['JVBER'],
  'image/png': ['iVBOR'],
  'image/jpeg': ['/9j/'],
  'image/webp': ['UklGR'],
}

// --- Types ---

export interface AttachmentPayload {
  type: AllowedFileType
  data: string
  name: string
  size: number
}

export interface ValidatedMessage {
  role: 'user' | 'assistant'
  content: string
  attachments?: AttachmentPayload[]
}

export interface ValidatedChatRequest {
  persona: PersonaId
  messages: ValidatedMessage[]
  detection: SuspiciousInputResult
}

interface ValidationError {
  error: string
  status: number
}

export type ValidationResult =
  | { ok: true; data: ValidatedChatRequest }
  | { ok: false; error: ValidationError }

// --- Helpers ---

function isValidPersona(value: unknown): value is PersonaId {
  return typeof value === 'string' && PERSONA_IDS.includes(value as PersonaId)
}

function isValidMessageRole(
  role: unknown
): role is (typeof VALID_MESSAGE_ROLES)[number] {
  return (
    typeof role === 'string' &&
    VALID_MESSAGE_ROLES.includes(role as (typeof VALID_MESSAGE_ROLES)[number])
  )
}

function isValidBase64(data: string): boolean {
  return BASE64_REGEX.test(data)
}

function isSafeFileName(name: string): boolean {
  if (!SAFE_FILE_NAME_REGEX.test(name)) return false
  if (name.includes('..')) return false
  return true
}

function matchesMagicBytes(type: AllowedFileType, data: string): boolean {
  const prefixes = MAGIC_BYTE_PREFIXES[type]
  if (!prefixes) return true // text types have no magic bytes to check
  return prefixes.some((prefix) => data.startsWith(prefix))
}

function validateAttachments(
  attachments: unknown[]
): AttachmentPayload[] | null {
  if (attachments.length > MAX_FILES_PER_MESSAGE) return null

  const validated: AttachmentPayload[] = []
  for (const att of attachments) {
    if (!att || typeof att !== 'object') return null
    const { type, data, name, size } = att as Record<string, unknown>

    if (typeof type !== 'string' || !isAllowedFileType(type)) return null
    if (typeof data !== 'string' || data.length === 0) return null
    if (!isValidBase64(data)) return null
    if (data.length > MAX_BASE64_LENGTH) return null
    if (typeof name !== 'string' || name.length === 0) return null
    if (name.length > MAX_FILE_NAME_LENGTH) return null
    if (!isSafeFileName(name)) return null
    if (typeof size !== 'number' || size <= 0) return null
    if (size > MAX_FILE_SIZE_BYTES) return null
    if (!matchesMagicBytes(type, data)) return null

    validated.push({ type, data, name, size })
  }
  return validated
}

// --- Main validator ---

/**
 * Validate and parse the chat request body.
 *
 * Returns either a validated request object or a structured error
 * with HTTP status code. Keeps the route handler focused on
 * orchestration (auth, rate limiting, streaming).
 */
export function validateChatRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: { error: 'Invalid request body', status: 400 } }
  }

  const { persona, messages } = body as Record<string, unknown>

  if (!isValidPersona(persona)) {
    return { ok: false, error: { error: 'Invalid persona', status: 400 } }
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: { error: 'Messages are required', status: 400 } }
  }

  if (messages.length > MAX_MESSAGES_PER_REQUEST) {
    return { ok: false, error: { error: 'Too many messages', status: 400 } }
  }

  const validatedMessages: ValidatedMessage[] = []

  // Validate each message: role, content, and optional attachments
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return {
        ok: false,
        error: { error: 'Invalid message format', status: 400 },
      }
    }
    const { role, content, attachments } = msg as Record<string, unknown>
    if (!isValidMessageRole(role)) {
      return {
        ok: false,
        error: { error: 'Invalid message role', status: 400 },
      }
    }
    if (typeof content !== 'string') {
      return {
        ok: false,
        error: { error: 'Invalid message content', status: 400 },
      }
    }
    // Enforce role-appropriate length limits
    const maxLength =
      role === 'user' ? CHAT_INPUT_MAX_LENGTH : MAX_MESSAGE_LENGTH
    if (content.length > maxLength) {
      return { ok: false, error: { error: 'Message too long', status: 400 } }
    }

    // Validate optional attachments (user messages only)
    let validatedAttachments: AttachmentPayload[] | undefined
    if (attachments !== undefined) {
      if (role !== 'user') {
        return {
          ok: false,
          error: { error: 'Invalid attachment', status: 400 },
        }
      }
      if (!Array.isArray(attachments)) {
        return {
          ok: false,
          error: { error: 'Invalid attachment', status: 400 },
        }
      }
      const result = validateAttachments(attachments)
      if (!result) {
        return {
          ok: false,
          error: { error: 'Invalid attachment', status: 400 },
        }
      }
      validatedAttachments = result.length > 0 ? result : undefined
    }

    validatedMessages.push({
      role,
      content,
      ...(validatedAttachments ? { attachments: validatedAttachments } : {}),
    })
  }

  // Validate conversation structure: must alternate user/assistant roles
  // starting with user (the trigger), with an odd total count.
  if (validatedMessages[0].role !== 'user') {
    return {
      ok: false,
      error: { error: 'Invalid message structure', status: 400 },
    }
  }
  if (validatedMessages[0].content.length > MAX_TRIGGER_LENGTH) {
    return {
      ok: false,
      error: { error: 'Invalid message structure', status: 400 },
    }
  }
  if (messages.length % 2 === 0) {
    return {
      ok: false,
      error: { error: 'Invalid message structure', status: 400 },
    }
  }
  for (let i = 1; i < validatedMessages.length; i++) {
    const expectedRole = i % 2 === 0 ? 'user' : 'assistant'
    if (validatedMessages[i].role !== expectedRole) {
      return {
        ok: false,
        error: { error: 'Invalid message structure', status: 400 },
      }
    }
  }

  // Detect suspicious input patterns in ALL user messages (for logging only).
  // Scanning all messages prevents blind spots where injection payloads
  // are placed in earlier messages with a benign final message.
  const userMessages = validatedMessages.filter((m) => m.role === 'user')
  const detections = userMessages.map((m) => detectSuspiciousInput(m.content))
  const detection: SuspiciousInputResult = {
    suspicious: detections.some((d) => d.suspicious),
    patterns: [...new Set(detections.flatMap((d) => d.patterns))],
  }

  return {
    ok: true,
    data: {
      persona,
      messages: validatedMessages,
      detection,
    },
  }
}
