import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages'
import { sanitizeMessageContent } from '@/lib/ai/sanitize'
import { isImageType } from '@/lib/files/format'
import type { ValidatedMessage } from '@/lib/ai/validate-chat-request'

type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'document'
      source: { type: 'base64'; media_type: 'application/pdf'; data: string }
      title?: string
    }
  | {
      type: 'document'
      source: { type: 'text'; media_type: 'text/plain'; data: string }
      title?: string
    }
  | {
      type: 'image'
      source: {
        type: 'base64'
        media_type: 'image/png' | 'image/jpeg' | 'image/webp'
        data: string
      }
    }

const TEXT_MIME_TYPES = new Set(['text/plain', 'text/markdown', 'text/csv'])

/**
 * Transform validated messages into Anthropic SDK MessageParam format.
 *
 * - Assistant messages → plain string content (unchanged)
 * - User messages without attachments → plain string content (unchanged)
 * - User messages with attachments → ContentBlockParam[] with document/image blocks
 */
export function buildAnthropicMessages(
  messages: ValidatedMessage[]
): MessageParam[] {
  return messages.map((msg) => {
    // Assistant messages are always plain text
    if (msg.role === 'assistant') {
      return {
        role: 'assistant' as const,
        content: sanitizeMessageContent(msg.content),
      }
    }

    // User messages without attachments: plain string (backward compatible)
    if (!msg.attachments || msg.attachments.length === 0) {
      return {
        role: 'user' as const,
        content: sanitizeMessageContent(msg.content),
      }
    }

    // User messages with attachments: content block array
    const blocks: ContentBlock[] = []

    for (const attachment of msg.attachments) {
      if (attachment.type === 'application/pdf') {
        blocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: attachment.data,
          },
          title: attachment.name,
        })
      } else if (TEXT_MIME_TYPES.has(attachment.type)) {
        // Decode base64 text to UTF-8 string for PlainTextSource
        let decoded: string
        try {
          decoded = Buffer.from(attachment.data, 'base64').toString('utf-8')
        } catch {
          // Skip malformed base64 — validation should catch this upstream
          continue
        }
        blocks.push({
          type: 'document',
          source: {
            type: 'text',
            media_type: 'text/plain',
            data: decoded,
          },
          title: attachment.name,
        })
      } else if (isImageType(attachment.type)) {
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: attachment.type as
              | 'image/png'
              | 'image/jpeg'
              | 'image/webp',
            data: attachment.data,
          },
        })
      }
    }

    // Add text block if there's text content
    const sanitized = sanitizeMessageContent(msg.content)
    if (sanitized.trim()) {
      blocks.push({ type: 'text', text: sanitized })
    }

    return {
      role: 'user' as const,
      content: blocks,
    }
  })
}
