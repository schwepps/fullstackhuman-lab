export const MAX_CONVERSATIONS_PER_DAY = 3
export const MAX_MESSAGES_PER_REQUEST = 50
export const RATE_LIMIT_COOKIE_NAME = 'fsh_conversations'
export const RATE_LIMIT_COOKIE_MAX_AGE_SECONDS = 86_400 // 24 hours

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
export const ANTHROPIC_MAX_TOKENS = 4096

export const CHAT_INPUT_MAX_LENGTH = 4000

// First request sends 3 messages: synthetic trigger + opening + first real user message.
// Subsequent requests add 2 more each time (user + assistant), so: 3, 5, 7, 9...
export const NEW_CONVERSATION_MESSAGE_COUNT = 3

export const VALID_MESSAGE_ROLES = ['user', 'assistant'] as const

export const BRAND_NAME = 'FULL_STACK_HUMAN'

// Error code → i18n key mapping for chat error messages
export type ErrorMessageKey =
  | 'rateLimitExceeded'
  | 'streamError'
  | 'genericError'

export const ERROR_MESSAGE_KEYS: Record<string, ErrorMessageKey> = {
  rate_limit_exceeded: 'rateLimitExceeded',
  stream_error: 'streamError',
  generic_error: 'genericError',
}
