import { TELEGRAM_MESSAGE_MAX_LENGTH } from '@/lib/telegram/constants'

/**
 * Characters that must be escaped in Telegram MarkdownV2.
 * Outside of formatting contexts (bold, italic, code, links),
 * these characters must be prefixed with a backslash.
 *
 * Reference: https://core.telegram.org/bots/api#markdownv2-style
 */
const MARKDOWNV2_SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g

/**
 * Escape a plain text string for safe inclusion in MarkdownV2.
 * Use this for user-provided text or any text outside formatting contexts.
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(MARKDOWNV2_SPECIAL_CHARS, '\\$1')
}

/**
 * Convert Claude's standard Markdown output to Telegram MarkdownV2.
 *
 * Handles:
 * - **bold** → *bold*
 * - *italic* / _italic_ → _italic_
 * - `inline code` → `inline code`
 * - ```code blocks``` → ```code blocks```
 * - [text](url) → [text](url) with proper escaping
 * - # Headings → *Heading* (bold, since Telegram has no heading syntax)
 * - - List items → preserved with bullet escaping
 * - Escapes all special chars outside formatting contexts
 *
 * Strategy: Process the text line-by-line, identifying formatting blocks
 * and escaping everything else.
 */
export function convertToMarkdownV2(markdown: string): string {
  const lines = markdown.split('\n')
  const result: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    // Toggle code block state
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }

    // Inside code blocks: no escaping needed (Telegram handles it)
    if (inCodeBlock) {
      result.push(line)
      continue
    }

    result.push(convertLine(line))
  }

  return result.join('\n')
}

function convertLine(line: string): string {
  // Headings → bold (Telegram has no heading syntax)
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
  if (headingMatch) {
    const content = convertInlineFormatting(headingMatch[2])
    return `*${content}*`
  }

  // Horizontal rules → escaped dashes
  if (/^---+$/.test(line.trim())) {
    return escapeMarkdownV2('---')
  }

  // Unordered list items
  const ulMatch = line.match(/^(\s*)[*-]\s+(.+)$/)
  if (ulMatch) {
    const indent = ulMatch[1]
    const content = convertInlineFormatting(ulMatch[2])
    return `${indent}• ${content}`
  }

  // Ordered list items
  const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/)
  if (olMatch) {
    const indent = olMatch[1]
    const num = escapeMarkdownV2(olMatch[2] + '.')
    const content = convertInlineFormatting(olMatch[3])
    return `${indent}${num} ${content}`
  }

  // Blockquotes
  if (line.startsWith('>')) {
    const content = convertInlineFormatting(line.slice(1).trimStart())
    return `>${content}`
  }

  // Regular line
  return convertInlineFormatting(line)
}

/**
 * Convert inline formatting within a line.
 * Processes bold, italic, inline code, and links.
 * Escapes all other special characters.
 */
function convertInlineFormatting(text: string): string {
  // Protect code spans and links first via placeholders, then process bold/italic
  const codeBlocks: string[] = []
  const linkBlocks: string[] = []
  let processed = text

  // Replace inline code with placeholders
  processed = processed.replace(/`([^`]+)`/g, (_match, code: string) => {
    const idx = codeBlocks.length
    codeBlocks.push(`\`${code}\``)
    return `\x00CODE${idx}\x00`
  })

  // Replace links with placeholders
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, linkText: string, url: string) => {
      const idx = linkBlocks.length
      linkBlocks.push(`[${escapeMarkdownV2(linkText)}](${url})`)
      return `\x00LINK${idx}\x00`
    }
  )

  // Convert bold: **text** → *text*
  processed = processed.replace(
    /\*\*(.+?)\*\*/g,
    (_match, _content: string) => {
      return `\x00BOLD_START\x00${_content}\x00BOLD_END\x00`
    }
  )

  // Convert italic: *text* → _text_
  processed = processed.replace(
    /(?<!\*)\*(.+?)\*(?!\*)/g,
    (_match, _content: string) => {
      return `\x00ITALIC_START\x00${_content}\x00ITALIC_END\x00`
    }
  )

  // Escape remaining special chars outside formatting placeholders
  const parts = processed.split(/(\x00[A-Z_]+\d*\x00)/g)
  return parts
    .map((part) => {
      if (part.startsWith('\x00') && part.endsWith('\x00')) {
        const inner = part.slice(1, -1)
        if (inner.startsWith('CODE')) {
          return codeBlocks[parseInt(inner.slice(4), 10)]
        }
        if (inner.startsWith('LINK')) {
          return linkBlocks[parseInt(inner.slice(4), 10)]
        }
        if (inner === 'BOLD_START') return '*'
        if (inner === 'BOLD_END') return '*'
        if (inner === 'ITALIC_START') return '_'
        if (inner === 'ITALIC_END') return '_'
        return part
      }
      return escapeMarkdownV2(part)
    })
    .join('')
}

/**
 * Split a long message into chunks that fit within Telegram's 4096-char limit.
 *
 * Strategy:
 * 1. Split at paragraph boundaries (double newline)
 * 2. If a paragraph is still too long, split at single newlines
 * 3. If a single line is too long, hard-split at the limit
 */
export function splitMessage(
  text: string,
  maxLength: number = TELEGRAM_MESSAGE_MAX_LENGTH
): string[] {
  if (text.length <= maxLength) return [text]

  const messages: string[] = []
  const paragraphs = text.split('\n\n')
  let current = ''

  for (const paragraph of paragraphs) {
    const separator = current ? '\n\n' : ''
    const candidate = current + separator + paragraph

    if (candidate.length <= maxLength) {
      current = candidate
      continue
    }

    // Current buffer is non-empty and adding paragraph exceeds limit
    if (current) {
      messages.push(current)
      current = ''
    }

    // Check if the paragraph itself fits
    if (paragraph.length <= maxLength) {
      current = paragraph
      continue
    }

    // Paragraph too long — split by single newlines
    const lines = paragraph.split('\n')
    for (const line of lines) {
      const lineSep = current ? '\n' : ''
      const lineCandidate = current + lineSep + line

      if (lineCandidate.length <= maxLength) {
        current = lineCandidate
        continue
      }

      if (current) {
        messages.push(current)
        current = ''
      }

      // Single line too long — hard split
      if (line.length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          const chunk = line.slice(i, i + maxLength)
          if (i + maxLength < line.length) {
            messages.push(chunk)
          } else {
            current = chunk
          }
        }
      } else {
        current = line
      }
    }
  }

  if (current) {
    messages.push(current)
  }

  return messages
}
