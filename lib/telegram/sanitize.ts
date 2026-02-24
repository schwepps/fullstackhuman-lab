import { sanitizeMessageContent } from '@/lib/ai/sanitize'
import { CHAT_INPUT_MAX_LENGTH } from '@/lib/constants/chat'

/**
 * Bidi override characters that can manipulate text display direction.
 * Strip from display names and stored text to prevent log spoofing.
 */
const BIDI_CHARS_REGEX = /[\u202A-\u202E\u2066-\u2069]/g

/**
 * Sanitize a Telegram message text for use as AI input.
 *
 * - Strips bot commands (e.g., /start, /help@BotName)
 * - Applies the existing Unicode control character sanitization
 * - Enforces max length matching the web chat input limit
 * - Returns null if the result is empty (command-only messages, etc.)
 *
 * Design decision: Only use message.text (raw text). Never reconstruct
 * formatted text from Telegram entities — entities can hide injection
 * payloads behind innocent-looking text_link entities.
 */
export function sanitizeTelegramMessage(
  text: string | undefined
): string | null {
  if (!text) return null
  if (text.length > CHAT_INPUT_MAX_LENGTH) return null

  // Strip bot command prefix (e.g., "/start", "/help@BotName param")
  const withoutCommand = text.replace(/^\/\w+(@\w+)?\s*/, '')
  if (!withoutCommand.length) return null

  // Apply shared Unicode sanitization (strips control chars)
  const sanitized = sanitizeMessageContent(withoutCommand)
  const trimmed = sanitized.trim()
  return trimmed.length ? trimmed : null
}

/**
 * Strip bidi override characters from display text.
 * Used for logging Telegram user names safely — prevents
 * RTL override attacks that can make "admin" appear as something else.
 */
export function stripBidiChars(text: string): string {
  return text.replace(BIDI_CHARS_REGEX, '')
}

/**
 * Validate and sanitize a /start deep link parameter.
 * Only allows alphanumeric characters, hyphens, and underscores.
 * Returns null if invalid.
 */
export function sanitizeStartParam(param: string | undefined): string | null {
  if (!param) return null
  if (param.length > 64) return null
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) return null
  return param
}
