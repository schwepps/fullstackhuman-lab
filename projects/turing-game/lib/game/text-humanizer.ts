import type { AgentPersona } from './types'

// QWERTY keyboard adjacency for realistic typos
const ADJACENT_KEYS: Record<string, string[]> = {
  q: ['w', 'a'],
  w: ['q', 'e', 's'],
  e: ['w', 'r', 'd'],
  r: ['e', 't', 'f'],
  t: ['r', 'y', 'g'],
  y: ['t', 'u', 'h'],
  u: ['y', 'i', 'j'],
  i: ['u', 'o', 'k'],
  o: ['i', 'p', 'l'],
  p: ['o', 'l'],
  a: ['q', 'w', 's', 'z'],
  s: ['a', 'w', 'd', 'z', 'x'],
  d: ['s', 'e', 'f', 'x', 'c'],
  f: ['d', 'r', 'g', 'c', 'v'],
  g: ['f', 't', 'h', 'v', 'b'],
  h: ['g', 'y', 'j', 'b', 'n'],
  j: ['h', 'u', 'k', 'n', 'm'],
  k: ['j', 'i', 'l', 'm'],
  l: ['k', 'o', 'p'],
  z: ['a', 's', 'x'],
  x: ['z', 's', 'd', 'c'],
  c: ['x', 'd', 'f', 'v'],
  v: ['c', 'f', 'g', 'b'],
  b: ['v', 'g', 'h', 'n'],
  n: ['b', 'h', 'j', 'm'],
  m: ['n', 'j', 'k'],
}

/**
 * Post-process agent text to add human-like imperfections.
 * Strips AI formatting, injects typos, and applies casual style.
 */
export function humanizeText(text: string, persona: AgentPersona): string {
  let result = stripAiFormatting(text)
  result = injectTypos(result, persona.typoRate)
  result = applyCasualness(result, persona)
  return result.trim()
}

function stripAiFormatting(text: string): string {
  let result = text
  // Strip markdown bold/italic
  result = result.replace(/\*\*(.+?)\*\*/g, '$1')
  result = result.replace(/\*(.+?)\*/g, '$1')
  result = result.replace(/_(.+?)_/g, '$1')
  // Strip markdown lists
  result = result.replace(/^[-*]\s+/gm, '')
  result = result.replace(/^\d+\.\s+/gm, '')
  // Replace em-dashes with regular dashes
  result = result.replace(/—/g, '-')
  result = result.replace(/–/g, '-')
  // Strip colon-structured patterns ("Here's the thing:")
  result = result.replace(/^[A-Z][^.!?]*:\s*/gm, '')
  // Strip quotes
  result = result.replace(/^>\s+/gm, '')
  return result
}

function injectTypos(text: string, rate: number): string {
  if (rate <= 0) return text

  const words = text.split(' ')
  return words
    .map((word, i) => {
      // Never typo the first word
      if (i === 0) return word
      // Only typo words with 3+ chars
      if (word.length < 3) return word
      if (Math.random() > rate) return word

      const typoType = Math.random()
      if (typoType < 0.4) return adjacentKeySwap(word)
      if (typoType < 0.7) return doubledLetter(word)
      return missedLetter(word)
    })
    .join(' ')
}

function adjacentKeySwap(word: string): string {
  const chars = [...word]
  // Pick a random position (not first char)
  const pos = 1 + Math.floor(Math.random() * (chars.length - 1))
  const char = chars[pos].toLowerCase()
  const adjacent = ADJACENT_KEYS[char]
  if (!adjacent || adjacent.length === 0) return word
  const replacement = adjacent[Math.floor(Math.random() * adjacent.length)]
  chars[pos] =
    chars[pos] === chars[pos].toUpperCase()
      ? replacement.toUpperCase()
      : replacement
  return chars.join('')
}

function doubledLetter(word: string): string {
  const pos = 1 + Math.floor(Math.random() * (word.length - 1))
  return word.slice(0, pos) + word[pos] + word.slice(pos)
}

function missedLetter(word: string): string {
  const pos = 1 + Math.floor(Math.random() * (word.length - 1))
  return word.slice(0, pos) + word.slice(pos + 1)
}

function applyCasualness(text: string, persona: AgentPersona): string {
  let result = text

  if (persona.casualness === 'high') {
    // Lowercase first letter (50% chance)
    if (Math.random() < 0.5 && result.length > 0) {
      result = result[0].toLowerCase() + result.slice(1)
    }
    // "you" -> "u" (30% chance per occurrence)
    result = result.replace(/\byou\b/gi, (match) =>
      Math.random() < 0.3 ? 'u' : match
    )
  } else if (persona.casualness === 'medium') {
    // Lowercase first letter (15% chance)
    if (Math.random() < 0.15 && result.length > 0) {
      result = result[0].toLowerCase() + result.slice(1)
    }
  }

  // Remove trailing period (40% for high, 20% for medium)
  const removePeriodChance =
    persona.casualness === 'high'
      ? 0.4
      : persona.casualness === 'medium'
        ? 0.2
        : 0
  if (Math.random() < removePeriodChance && result.endsWith('.')) {
    result = result.slice(0, -1)
  }

  // Jade-specific: trailing "..."
  if (persona.id === 'jade' && Math.random() < 0.2 && !result.endsWith('.')) {
    result += '...'
  }

  // Sofia-specific: occasional double exclamation
  if (persona.id === 'sofia') {
    result = result.replace(/!$/g, (m) => (Math.random() < 0.15 ? '!!' : m))
  }

  return result
}
