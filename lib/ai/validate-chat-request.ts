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
} from '@/lib/constants/chat'
import type { PersonaId } from '@/types/chat'

export interface ValidatedChatRequest {
  persona: PersonaId
  messages: { role: 'user' | 'assistant'; content: string }[]
  detection: SuspiciousInputResult
}

interface ValidationError {
  error: string
  status: number
}

export type ValidationResult =
  | { ok: true; data: ValidatedChatRequest }
  | { ok: false; error: ValidationError }

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

  // Validate each message: role must be user|assistant, content must be string
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return {
        ok: false,
        error: { error: 'Invalid message format', status: 400 },
      }
    }
    const { role, content } = msg as Record<string, unknown>
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
  }

  // Validate conversation structure: must alternate user/assistant roles
  // starting with user (the trigger), with an odd total count.
  const typedMessages = messages as { role: string; content: string }[]
  if (typedMessages[0].role !== 'user') {
    return {
      ok: false,
      error: { error: 'Invalid message structure', status: 400 },
    }
  }
  if (typedMessages[0].content.length > MAX_TRIGGER_LENGTH) {
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
  for (let i = 1; i < typedMessages.length; i++) {
    const expectedRole = i % 2 === 0 ? 'user' : 'assistant'
    if (typedMessages[i].role !== expectedRole) {
      return {
        ok: false,
        error: { error: 'Invalid message structure', status: 400 },
      }
    }
  }

  // Detect suspicious input patterns in ALL user messages (for logging only).
  // Scanning all messages prevents blind spots where injection payloads
  // are placed in earlier messages with a benign final message.
  const userMessages = typedMessages.filter((m) => m.role === 'user')
  const detections = userMessages.map((m) => detectSuspiciousInput(m.content))
  const detection: SuspiciousInputResult = {
    suspicious: detections.some((d) => d.suspicious),
    patterns: [...new Set(detections.flatMap((d) => d.patterns))],
  }

  return {
    ok: true,
    data: {
      persona,
      messages: typedMessages as {
        role: 'user' | 'assistant'
        content: string
      }[],
      detection,
    },
  }
}
