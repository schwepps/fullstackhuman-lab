import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkEvalRateAllowed } from '@/lib/rate-limiter'

const mockPipelineExec = vi.fn()
const mockPipelineIncr = vi.fn()
const mockPipelineExpire = vi.fn()

vi.mock('@/lib/upstash', () => ({
  getRedisClient: () => ({
    pipeline: () => ({
      incr: mockPipelineIncr,
      expire: mockPipelineExpire,
      exec: mockPipelineExec,
    }),
  }),
}))

// Each pipeline returns [count, expireResult, count, expireResult]
const counts = (a: number, b: number) => [a, 1, b, 1]

describe('checkEvalRateAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPipelineIncr.mockReturnThis()
    mockPipelineExpire.mockReturnThis()
  })

  it('allows requests under all limits', async () => {
    mockPipelineExec
      .mockResolvedValueOnce(counts(1, 1))
      .mockResolvedValueOnce(counts(1, 1))

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result).toEqual({ allowed: true })
    expect(mockPipelineIncr).toHaveBeenCalledTimes(4)
    expect(mockPipelineExpire).toHaveBeenCalledTimes(4)
  })

  it('allows the request that reaches the hourly limit exactly', async () => {
    mockPipelineExec
      .mockResolvedValueOnce(counts(5, 5))
      .mockResolvedValueOnce(counts(1, 1))

    expect((await checkEvalRateAllowed('1.2.3.4')).allowed).toBe(true)
  })

  it('blocks when hourly limit exceeded, without touching shared counters', async () => {
    mockPipelineExec.mockResolvedValueOnce(counts(6, 6))

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('hour')
    expect(mockPipelineExec).toHaveBeenCalledTimes(1)
  })

  it('blocks when daily limit exceeded', async () => {
    mockPipelineExec.mockResolvedValueOnce(counts(1, 16))

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Daily')
    expect(mockPipelineExec).toHaveBeenCalledTimes(1)
  })

  it('blocks when global limit exceeded', async () => {
    mockPipelineExec
      .mockResolvedValueOnce(counts(1, 1))
      .mockResolvedValueOnce(counts(31, 1))

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('demand')
  })

  it('blocks everyone once the daily budget is spent', async () => {
    mockPipelineExec
      .mockResolvedValueOnce(counts(1, 1))
      .mockResolvedValueOnce(counts(1, 1001))

    const result = await checkEvalRateAllowed('5.6.7.8')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('enough for today')
  })

  it('starts each window once instead of extending it on every request', async () => {
    mockPipelineExec
      .mockResolvedValueOnce(counts(1, 1))
      .mockResolvedValueOnce(counts(1, 1))

    await checkEvalRateAllowed('1.2.3.4')

    for (const call of mockPipelineExpire.mock.calls) {
      expect(call[2]).toBe('NX')
    }
  })
})
