import { describe, it, expect } from 'vitest'
import { validatePrompt } from '@/lib/anti-gaming'

describe('validatePrompt', () => {
  it('accepts valid natural language prompts', () => {
    expect(validatePrompt('reverse a string').isValid).toBe(true)
    expect(validatePrompt('cache function results by arguments').isValid).toBe(
      true
    )
    expect(validatePrompt('split array into chunks of size n').isValid).toBe(
      true
    )
  })

  it('rejects empty prompts', () => {
    const result = validatePrompt('')
    expect(result.isValid).toBe(false)
    expect(result.wordCount).toBe(0)
  })

  it('rejects whitespace-only prompts', () => {
    const result = validatePrompt('   ')
    expect(result.isValid).toBe(false)
  })

  it('rejects single-word prompts (below minimum)', () => {
    const result = validatePrompt('reverse')
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('at least')
  })

  it('rejects arrow functions', () => {
    const result = validatePrompt('use x => x + 1 to add')
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('code')
  })

  it('rejects function declarations', () => {
    const result = validatePrompt('write function( that reverses')
    expect(result.isValid).toBe(false)
  })

  it('rejects method chain code', () => {
    const result = validatePrompt('do arr.reverse( please')
    expect(result.isValid).toBe(false)
  })

  it('rejects template literal interpolation', () => {
    const result = validatePrompt('return ${value} as output')
    expect(result.isValid).toBe(false)
  })

  it('rejects variable declarations', () => {
    const result = validatePrompt('const x = something useful')
    expect(result.isValid).toBe(false)
  })

  it('allows technical vocabulary without code syntax', () => {
    expect(validatePrompt('use split method').isValid).toBe(true)
    expect(validatePrompt('apply recursion deeply').isValid).toBe(true)
    expect(validatePrompt('memoize with arguments').isValid).toBe(true)
    expect(validatePrompt('debounce the input handler').isValid).toBe(true)
  })

  it('rejects excessive repetition', () => {
    const result = validatePrompt('a a a a a a a a a a')
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('repeated')
  })

  it('allows some repetition in short prompts', () => {
    // 2-word prompts skip the variety check
    expect(validatePrompt('reverse reverse').isValid).toBe(true)
  })

  it('returns word count even for invalid prompts', () => {
    const result = validatePrompt('use x => x')
    expect(result.isValid).toBe(false)
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('rejects prompts exceeding MAX_PROMPT_LENGTH', () => {
    const longPrompt = 'word '.repeat(200) // 1000 chars
    const result = validatePrompt(longPrompt)
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('too long')
  })

  it('accepts prompt at exactly MAX_PROMPT_WORDS', () => {
    // 100 unique 2-char words = 299 chars (under 500 limit)
    const words = Array.from({ length: 100 }, (_, i) => {
      const a = String.fromCharCode(97 + (i % 26))
      const b = String.fromCharCode(97 + Math.floor(i / 26))
      return `${a}${b}${i}`
    })
    const prompt = words.join(' ')
    expect(validatePrompt(prompt).isValid).toBe(true)
  })

  it('rejects prompt exceeding MAX_PROMPT_WORDS', () => {
    const words = Array.from({ length: 101 }, (_, i) => {
      const a = String.fromCharCode(97 + (i % 26))
      const b = String.fromCharCode(97 + Math.floor(i / 26))
      return `${a}${b}${i}`
    })
    const prompt = words.join(' ')
    const result = validatePrompt(prompt)
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('Maximum')
  })
})
