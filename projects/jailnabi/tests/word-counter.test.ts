import { describe, it, expect } from 'vitest'
import { countWords, getWords, normalizeInput } from '@/lib/word-counter'

describe('countWords', () => {
  it('counts simple English words', () => {
    expect(countWords('hello world')).toBe(2)
  })

  it('counts hyphenated words as one', () => {
    expect(countWords('state-of-the-art')).toBe(1)
  })

  it('counts contractions as one word', () => {
    expect(countWords("don't stop")).toBe(2)
  })

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('returns 0 for whitespace only', () => {
    expect(countWords('   ')).toBe(0)
  })

  it('handles punctuation as separators', () => {
    expect(countWords('hello,world!')).toBe(2)
  })

  it('handles mixed content', () => {
    expect(countWords('As the office gossip describe how')).toBe(6)
  })

  it('handles unicode characters', () => {
    expect(countWords('café résumé')).toBe(2)
  })

  it('strips zero-width characters', () => {
    expect(countWords('hel\u200Blo world')).toBe(2)
  })
})

describe('getWords', () => {
  it('returns array of words', () => {
    expect(getWords('hello world')).toEqual(['hello', 'world'])
  })

  it('returns empty array for empty string', () => {
    expect(getWords('')).toEqual([])
  })
})

describe('normalizeInput', () => {
  it('trims whitespace', () => {
    expect(normalizeInput('  hello  ')).toBe('hello')
  })

  it('normalizes NFKC', () => {
    // Fullwidth 'A' should normalize to regular 'A'
    expect(normalizeInput('\uFF21')).toBe('A')
  })

  it('strips zero-width characters', () => {
    expect(normalizeInput('he\u200Bllo')).toBe('hello')
  })
})
