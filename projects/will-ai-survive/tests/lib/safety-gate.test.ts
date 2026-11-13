import { describe, it, expect, vi } from 'vitest'

const parseMock = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { parse: parseMock }
  },
}))

describe('checkInputSafety model gate', () => {
  const input = 'My manager books 3-hour meetings to plan meetings.'

  it('passes a SAFE verdict', async () => {
    parseMock.mockResolvedValueOnce({
      stop_reason: 'end_turn',
      parsed_output: { verdict: 'SAFE' },
    })
    const { checkInputSafety } = await import('@/lib/security')

    expect(await checkInputSafety(input)).toEqual({
      safe: true,
      reason: 'safe',
    })
  })

  it('blocks when the model refuses', async () => {
    parseMock.mockResolvedValueOnce({
      stop_reason: 'refusal',
      parsed_output: null,
    })
    const { checkInputSafety } = await import('@/lib/security')

    expect(await checkInputSafety(input)).toEqual({
      safe: false,
      reason: 'blocked',
    })
  })

  it('rejects as unavailable, not as bad content, when the API call fails', async () => {
    parseMock.mockRejectedValueOnce(new Error('503'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { checkInputSafety } = await import('@/lib/security')

    expect(await checkInputSafety(input)).toEqual({
      safe: false,
      reason: 'unavailable',
    })
  })
})
