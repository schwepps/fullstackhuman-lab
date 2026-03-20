import { describe, it, expect } from 'vitest'
import { countWords, getWords } from '@/lib/word-counter'

describe('countWords', () => {
  it('counts simple words', () => {
    expect(countWords('reverse a string')).toBe(3)
  })

  it('counts single character words', () => {
    expect(countWords('a b c')).toBe(3)
  })

  it('treats contractions as one word', () => {
    expect(countWords("don't reverse it")).toBe(3)
  })

  it('treats hyphenated words as one word', () => {
    expect(countWords('well-known pattern')).toBe(2)
  })

  it('treats CamelCase as one word', () => {
    expect(countWords('TypeScript function')).toBe(2)
  })

  it('counts numbers as words', () => {
    expect(countWords('1 2 3')).toBe(3)
  })

  it('splits on operators/punctuation', () => {
    // array.split counts as 2 words (array, split)
    expect(countWords('array.split')).toBe(2)
  })

  it('makes code syntax expensive in word count', () => {
    // This is the primary anti-gaming defense
    const code = "array.split('').reverse().join('')"
    const count = countWords(code)
    expect(count).toBeGreaterThanOrEqual(4)
  })

  it('strips brackets and counts contents', () => {
    expect(countWords('[1, 2, 3]')).toBe(3)
  })

  it('handles function-like syntax', () => {
    // function(x) => "function", "x" = 2 words
    expect(countWords('function(x)')).toBe(2)
  })

  it('ignores pure symbols', () => {
    expect(countWords(': =>')).toBe(0)
  })

  it('handles empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('handles whitespace-only', () => {
    expect(countWords('   ')).toBe(0)
  })

  it('handles quoted strings', () => {
    expect(countWords('"hello"')).toBe(1)
  })

  it('handles O notation', () => {
    // O(n log n) => O, n, log, n = 4 words
    expect(countWords('O(n log n)')).toBe(4)
  })

  it('trims before counting', () => {
    expect(countWords('  reverse a string  ')).toBe(3)
  })

  it('handles accented characters as part of words', () => {
    expect(countWords('utilise la méthode')).toBe(3)
  })

  it('handles tabs between words', () => {
    expect(countWords('reverse\ta\tstring')).toBe(3)
  })

  it('handles newlines between words', () => {
    expect(countWords('reverse\na\nstring')).toBe(3)
  })

  it('handles multiple consecutive spaces', () => {
    expect(countWords('reverse    a    string')).toBe(3)
  })

  it('strips zero-width characters', () => {
    // Zero-width chars between spaces should not create phantom words
    expect(countWords('reverse \u200B a \u200B string')).toBe(3)
    // Zero-width chars within a word are stripped, word stays intact
    expect(countWords('re\u200Bverse')).toBe(1)
  })

  it('normalizes fullwidth characters to ASCII via NFKC', () => {
    // Fullwidth 'ａ' (U+FF41) normalizes to 'a'
    expect(countWords('\uFF41 \uFF42 \uFF43')).toBe(3)
  })
})

describe('getWords', () => {
  it('returns array of matched words', () => {
    expect(getWords('reverse a string')).toEqual(['reverse', 'a', 'string'])
  })

  it('returns empty array for empty input', () => {
    expect(getWords('')).toEqual([])
  })

  it('preserves case', () => {
    expect(getWords('TypeScript')).toEqual(['TypeScript'])
  })

  it('splits on dots', () => {
    expect(getWords('array.map')).toEqual(['array', 'map'])
  })
})
