import { describe, it, expect } from 'vitest'
import { stopReasonError } from '@/lib/stop-reason'

describe('stopReasonError', () => {
  it('returns a user-facing message for a refusal', () => {
    expect(stopReasonError('refusal')).toMatch(/can't evaluate/i)
  })

  it('returns an incomplete-evaluation message when output was cut off', () => {
    expect(stopReasonError('max_tokens')).toMatch(/incomplete/i)
  })

  it('returns null for a normal end of turn', () => {
    expect(stopReasonError('end_turn')).toBeNull()
  })
})
