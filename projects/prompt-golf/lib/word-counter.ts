/**
 * Deterministic word counter for Prompt Golf.
 *
 * Uses alphanumeric-boundary tokenization. Hyphens and apostrophes
 * join adjacent alphanumeric runs into a single word. All other
 * punctuation splits words.
 *
 * This is also the primary anti-gaming defense: code syntax like
 * `array.split('').reverse()` counts as many words because operators
 * and brackets act as word separators.
 */

const WORD_PATTERN = /[a-zA-Z0-9](?:[a-zA-Z0-9'-]*[a-zA-Z0-9])?|[a-zA-Z0-9]/g

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed.length === 0) return 0
  const matches = trimmed.match(WORD_PATTERN)
  return matches?.length ?? 0
}

export function getWords(text: string): string[] {
  const trimmed = text.trim()
  if (trimmed.length === 0) return []
  return trimmed.match(WORD_PATTERN) ?? []
}
