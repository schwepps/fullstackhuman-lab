/**
 * Deterministic word counter for Prompt Golf.
 *
 * Uses Unicode-aware alphanumeric-boundary tokenization. Hyphens and
 * apostrophes join adjacent runs into a single word. All other
 * punctuation splits words.
 *
 * This is also the primary anti-gaming defense: code syntax like
 * `array.split('').reverse()` counts as many words because operators
 * and brackets act as word separators.
 *
 * Input is NFKC-normalized and stripped of zero-width characters
 * before counting, preventing homoglyph and invisible char attacks.
 */

const WORD_PATTERN =
  /[\p{L}\p{N}](?:[\p{L}\p{N}'-]*[\p{L}\p{N}])?|[\p{L}\p{N}]/gu

/** Strip zero-width and invisible Unicode characters, normalize to NFKC */
function normalizeInput(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200F\u2028-\u202F\u2060\uFEFF]/g, '')
    .trim()
}

export function countWords(text: string): number {
  const normalized = normalizeInput(text)
  if (normalized.length === 0) return 0
  const matches = normalized.match(WORD_PATTERN)
  return matches?.length ?? 0
}

export function getWords(text: string): string[] {
  const normalized = normalizeInput(text)
  if (normalized.length === 0) return []
  return normalized.match(WORD_PATTERN) ?? []
}
