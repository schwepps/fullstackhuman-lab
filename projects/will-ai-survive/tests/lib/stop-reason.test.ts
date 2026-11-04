import { describe, it, expect } from 'vitest'
import { INCOMPLETE_EVALUATION_ERROR, stopReasonError } from '@/lib/stop-reason'

describe('stopReasonError', () => {
  it('returns a user-facing message for a refusal', () => {
    expect(stopReasonError('refusal')).toMatch(/can't evaluate/i)
  })

  it('returns an incomplete-evaluation message when output was cut off', () => {
    expect(stopReasonError('max_tokens')).toBe(INCOMPLETE_EVALUATION_ERROR)
  })

  it('treats a context-window stop as incomplete too', () => {
    expect(stopReasonError('model_context_window_exceeded')).toBe(
      INCOMPLETE_EVALUATION_ERROR
    )
  })

  it('returns null for a normal end of turn', () => {
    expect(stopReasonError('end_turn')).toBeNull()
  })
})
