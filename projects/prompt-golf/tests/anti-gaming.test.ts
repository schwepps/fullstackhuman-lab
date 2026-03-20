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

  it('rejects multi-statement code', () => {
    const result = validatePrompt('split the array; reverse it')
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
})
