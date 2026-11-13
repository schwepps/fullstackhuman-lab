import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPipeline = {
  incr: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: vi.fn(),
}

vi.mock('../lib/upstash', () => ({
  getRedisClient: () => ({
    pipeline: () => mockPipeline,
    ttl: vi.fn().mockResolvedValue(600),
  }),
}))

import { checkAttemptAllowed, incrementAttemptCount } from '../lib/rate-limiter'

beforeEach(() => {
  vi.clearAllMocks()
})

// exec resolves to [globalCount, expireResult, challengeCount, expireResult],
// with both counts taken after the increment.
describe('checkAttemptAllowed', () => {
  it('allows the swing that lands exactly on the limits', async () => {
    mockPipeline.exec.mockResolvedValueOnce([30, 0, 8, 0])

    expect(
      (await checkAttemptAllowed('1.2.3.4', 'hole-1', false)).allowed
    ).toBe(true)
  })

  it('rejects once the global limit is passed', async () => {
    mockPipeline.exec.mockResolvedValueOnce([31, 0, 1, 1])

    const result = await checkAttemptAllowed('1.2.3.4', 'hole-1', false)

    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBe(600)
  })

  it('uses the lower per-hole limit for practice swings', async () => {
    mockPipeline.exec.mockResolvedValueOnce([7, 0, 7, 0])

    expect((await checkAttemptAllowed('1.2.3.4', 'hole-1', true)).allowed).toBe(
      false
    )
  })

  it('starts the window once instead of extending it on every swing', async () => {
    mockPipeline.exec.mockResolvedValueOnce([2, 0, 2, 0])

    await checkAttemptAllowed('1.2.3.4', 'hole-1', false)

    for (const call of mockPipeline.expire.mock.calls) {
      expect(call[2]).toBe('NX')
    }
  })
})

describe('incrementAttemptCount', () => {
  it('keeps the penalty when the session id is new but the IP is not', async () => {
    mockPipeline.exec.mockResolvedValueOnce([1, 1, 4, 0])

    expect(
      await incrementAttemptCount('new-session', 'hole-1', '1.2.3.4')
    ).toBe(4)
  })
})
