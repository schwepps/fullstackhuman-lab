import { describe, it, expect } from 'vitest'
import { situationSchema, RESULT_ID_PATTERN } from '@/lib/validation'

describe('situationSchema', () => {
  it('accepts valid input', () => {
    const result = situationSchema.safeParse(
      'My manager schedules 2-hour standups every day'
    )
    expect(result.success).toBe(true)
  })

  it('trims whitespace before checking length', () => {
    const padded = '   ' + 'a'.repeat(20) + '   '
    const result = situationSchema.safeParse(padded)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('a'.repeat(20))
    }
  })

  it('rejects whitespace-only input', () => {
    const result = situationSchema.safeParse('          ')
    expect(result.success).toBe(false)
  })

  it('rejects too-short input', () => {
    const result = situationSchema.safeParse('Too short')
    expect(result.success).toBe(false)
  })

  it('accepts exactly min-length input', () => {
    const result = situationSchema.safeParse('a'.repeat(20))
    expect(result.success).toBe(true)
  })

  it('rejects over-max-length input', () => {
    const result = situationSchema.safeParse('a'.repeat(1001))
    expect(result.success).toBe(false)
  })

  it('accepts exactly max-length input', () => {
    const result = situationSchema.safeParse('a'.repeat(1000))
    expect(result.success).toBe(true)
  })
})

describe('RESULT_ID_PATTERN', () => {
  it('accepts valid nanoid', () => {
    expect(RESULT_ID_PATTERN.test('abc123def456')).toBe(true)
  })

  it('accepts nanoid with underscores and hyphens', () => {
    expect(RESULT_ID_PATTERN.test('abc_123-def456')).toBe(true)
  })

  it('rejects too-short ID', () => {
    expect(RESULT_ID_PATTERN.test('abc')).toBe(false)
  })

  it('rejects ID with special characters', () => {
    expect(RESULT_ID_PATTERN.test('abc123!@#$%^')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(RESULT_ID_PATTERN.test('')).toBe(false)
  })
})
