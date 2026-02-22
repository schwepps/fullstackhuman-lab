import { MAX_TITLE_LENGTH } from '@/lib/constants/conversations'

/**
 * Extract a title from the first user message in a conversation.
 * Truncates to MAX_TITLE_LENGTH with ellipsis if needed.
 */
export function extractTitle(
  messages: { role: string; content: string }[]
): string | null {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (!firstUserMessage) return null
  const content = firstUserMessage.content.trim()
  if (content.length <= MAX_TITLE_LENGTH) return content
  return content.slice(0, MAX_TITLE_LENGTH - 1) + '\u2026'
}
