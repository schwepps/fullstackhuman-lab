export const MAX_MESSAGES_PER_REQUEST = 50
export const RATE_LIMIT_COOKIE_NAME = 'fsh_conversations'
export const RATE_LIMIT_COOKIE_MAX_AGE_SECONDS = 86_400 // 24 hours

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
export const ANTHROPIC_MAX_TOKENS = 4096

export const CHAT_INPUT_MAX_LENGTH = 4000
export const MAX_MESSAGE_LENGTH = 50_000

// First request sends 3 messages: synthetic trigger + opening + first real user message.
// Subsequent requests add 2 more each time (user + assistant), so: 3, 5, 7, 9...
export const NEW_CONVERSATION_MESSAGE_COUNT = 3

export const VALID_MESSAGE_ROLES = ['user', 'assistant'] as const

// Max length for the trigger message (first message in conversation).
// Trigger texts are short phrases like "My project is stuck" (~30 chars).
export const MAX_TRIGGER_LENGTH = 200

// IP rate limiting (chat API protection)
export const MAX_REQUESTS_PER_IP_PER_HOUR = 60
export const IP_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// --- File upload constants ---
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB per file
export const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024 // 20MB total per conversation request
export const MAX_FILES_PER_MESSAGE = 5
export const MAX_FILE_NAME_LENGTH = 255
export const FILE_INPUT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv'
export const READ_TIMEOUT_MS = 30_000 // 30 seconds for large file reads

export { BRAND_NAME, BRAND_NAME_SHORT } from '@/lib/constants/brand'

// Error code → i18n key mapping for chat error messages
export type ErrorMessageKey =
  | 'rateLimitExceeded'
  | 'streamError'
  | 'genericError'
  | 'invalidAttachment'
  | 'attachmentsTooLarge'

export const ERROR_MESSAGE_KEYS: Record<string, ErrorMessageKey> = {
  rate_limit_exceeded: 'rateLimitExceeded',
  stream_error: 'streamError',
  generic_error: 'genericError',
  invalid_attachment: 'invalidAttachment',
  attachments_too_large: 'attachmentsTooLarge',
}
