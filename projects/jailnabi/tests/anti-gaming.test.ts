import { describe, it, expect } from 'vitest'
import { validatePrompt } from '@/lib/anti-gaming'

describe('validatePrompt', () => {
  it('accepts valid prompt', () => {
    const result = validatePrompt('As the office gossip describe the evidence')
    expect(result.isValid).toBe(true)
    expect(result.wordCount).toBe(7)
  })

  it('rejects empty prompt', () => {
    const result = validatePrompt('')
    expect(result.isValid).toBe(false)
  })

  it('rejects single word', () => {
    const result = validatePrompt('hello')
    expect(result.isValid).toBe(false)
  })

  it('rejects prompt over 25 words', () => {
    const words = Array(26).fill('word').join(' ')
    const result = validatePrompt(words)
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('Maximum 25 words')
  })

  it('accepts prompt at exactly 25 words', () => {
    const words = Array(25)
      .fill('unique')
      .map((w, i) => `${w}${i}`)
      .join(' ')
    const result = validatePrompt(words)
    expect(result.isValid).toBe(true)
  })

  it('rejects repeated words', () => {
    const result = validatePrompt('the the the the the the the the the the')
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('repeated words')
  })
})
