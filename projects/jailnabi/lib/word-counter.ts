/**
 * Deterministic word counter for Jailnabi.
 *
 * Reused from Prompt Golf — Unicode-aware alphanumeric-boundary tokenization.
 * Hyphens and apostrophes join adjacent runs into a single word.
 * Input is NFKC-normalized and stripped of zero-width characters.
 */

const WORD_PATTERN =
  /[\p{L}\p{N}](?:[\p{L}\p{N}'-]*[\p{L}\p{N}])?|[\p{L}\p{N}]/gu

/** Strip zero-width and invisible Unicode characters, normalize to NFKC */
export function normalizeInput(text: string): string {
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
