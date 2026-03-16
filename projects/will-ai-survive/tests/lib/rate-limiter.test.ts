import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkEvalRateAllowed } from '@/lib/rate-limiter'

// Mock pipeline results
const mockPipelineExec = vi.fn()
const mockPipelineGet = vi.fn()
const mockPipelineIncr = vi.fn()
const mockPipelineExpire = vi.fn()

vi.mock('@/lib/upstash', () => ({
  getRedisClient: () => ({
    pipeline: () => ({
      get: mockPipelineGet,
      incr: mockPipelineIncr,
      expire: mockPipelineExpire,
      exec: mockPipelineExec,
    }),
  }),
}))

describe('checkEvalRateAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: pipeline methods return self for chaining
    mockPipelineGet.mockReturnThis()
    mockPipelineIncr.mockReturnThis()
    mockPipelineExpire.mockReturnThis()
  })

  it('allows requests under all limits', async () => {
    // First exec: read counters (all zero/null)
    mockPipelineExec
      .mockResolvedValueOnce([null, null, null])
      // Second exec: increment counters
      .mockResolvedValueOnce([1, true, 1, true, 1, true])

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('blocks when hourly limit exceeded', async () => {
    // Hourly count is at limit (5)
    mockPipelineExec.mockResolvedValueOnce([5, 0, 0])

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('hour')
    // Should not increment (only 1 exec call for reads)
    expect(mockPipelineExec).toHaveBeenCalledTimes(1)
  })

  it('blocks when daily limit exceeded', async () => {
    // Hourly OK (1), Daily at limit (15)
    mockPipelineExec.mockResolvedValueOnce([1, 15, 0])

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Daily')
    expect(mockPipelineExec).toHaveBeenCalledTimes(1)
  })

  it('blocks when global limit exceeded', async () => {
    // Hourly OK, Daily OK, Global at limit (30)
    mockPipelineExec.mockResolvedValueOnce([1, 1, 30])

    const result = await checkEvalRateAllowed('1.2.3.4')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('demand')
    expect(mockPipelineExec).toHaveBeenCalledTimes(1)
  })

  it('does not burn counters when rejected', async () => {
    // Daily limit exceeded
    mockPipelineExec.mockResolvedValueOnce([1, 15, 0])

    await checkEvalRateAllowed('1.2.3.4')

    // Only 1 pipeline exec (read) — no increment pipeline
    expect(mockPipelineExec).toHaveBeenCalledTimes(1)
  })

  it('increments all counters and sets TTLs when allowed', async () => {
    mockPipelineExec
      .mockResolvedValueOnce([0, 0, 0])
      .mockResolvedValueOnce([1, true, 1, true, 1, true])

    await checkEvalRateAllowed('1.2.3.4')

    // 2 pipeline execs: read + increment
    expect(mockPipelineExec).toHaveBeenCalledTimes(2)
    // Increment pipeline: 3 incr + 3 expire = 6 calls
    expect(mockPipelineIncr).toHaveBeenCalledTimes(3)
    expect(mockPipelineExpire).toHaveBeenCalledTimes(3)
  })
})
