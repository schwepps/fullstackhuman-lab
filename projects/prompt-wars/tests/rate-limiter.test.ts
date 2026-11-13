import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Redis pipeline and client
const mockPipeline = {
  get: vi.fn().mockReturnThis(),
  incr: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
  set: vi.fn().mockReturnThis(),
}

const mockRedis = {
  pipeline: vi.fn(() => mockPipeline),
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  ttl: vi.fn().mockResolvedValue(600),
}

vi.mock('../lib/upstash', () => ({
  getRedisClient: () => mockRedis,
}))

import {
  checkAttemptAllowed,
  incrementBudgetCounter,
  getDailyBudget,
  recordLevelWin,
  getVerifiedWins,
  getTotalAttempts,
  incrementAttemptCount,
} from '../lib/rate-limiter'

beforeEach(() => {
  vi.clearAllMocks()
  mockPipeline.exec.mockResolvedValue([])
})

// exec resolves to [globalCount, expireResult, levelCount, expireResult],
// with both counts taken after the increment.
describe('checkAttemptAllowed', () => {
  it('allows attempt when under all limits', async () => {
    mockPipeline.exec.mockResolvedValueOnce([1, 1, 1, 1])

    const result = await checkAttemptAllowed('127.0.0.1', 1)

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('allows the attempt that lands exactly on the limit', async () => {
    mockPipeline.exec.mockResolvedValueOnce([30, 0, 10, 0])

    const result = await checkAttemptAllowed('127.0.0.1', 3)

    expect(result.allowed).toBe(true)
  })

  it('rejects when the global limit is passed', async () => {
    mockPipeline.exec.mockResolvedValueOnce([31, 0, 1, 1])

    const result = await checkAttemptAllowed('127.0.0.1', 1)

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('SYSTEM LOCKOUT')
    expect(result.retryAfterSeconds).toBeDefined()
  })

  it('rejects when the per-level limit is passed for basic levels', async () => {
    mockPipeline.exec.mockResolvedValueOnce([11, 0, 11, 0])

    const result = await checkAttemptAllowed('127.0.0.1', 3)

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('FIREWALL COOLDOWN')
  })

  it('uses stricter limit for advanced levels (6+)', async () => {
    mockPipeline.exec.mockResolvedValueOnce([6, 0, 6, 0])

    const result = await checkAttemptAllowed('127.0.0.1', 6)

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('FIREWALL COOLDOWN')
  })

  it('allows a 6th attempt on basic levels', async () => {
    mockPipeline.exec.mockResolvedValueOnce([6, 0, 6, 0])

    const result = await checkAttemptAllowed('127.0.0.1', 3)

    expect(result.allowed).toBe(true)
  })

  it('counts before checking, in a single round trip', async () => {
    mockPipeline.exec.mockResolvedValueOnce([1, 1, 1, 1])

    await checkAttemptAllowed('127.0.0.1', 1)

    expect(mockRedis.pipeline).toHaveBeenCalledTimes(1)
    expect(mockPipeline.incr).toHaveBeenCalledTimes(2) // global + level
  })

  it('starts the window once instead of extending it on every attempt', async () => {
    mockPipeline.exec.mockResolvedValueOnce([2, 0, 2, 0])

    await checkAttemptAllowed('127.0.0.1', 1)

    expect(mockPipeline.expire).toHaveBeenCalledTimes(2)
    for (const call of mockPipeline.expire.mock.calls) {
      expect(call[2]).toBe('NX')
    }
  })
})

describe('incrementBudgetCounter', () => {
  it('increments and returns count', async () => {
    mockPipeline.exec.mockResolvedValueOnce([42])

    const count = await incrementBudgetCounter()

    expect(count).toBe(42)
    expect(mockPipeline.incr).toHaveBeenCalled()
    expect(mockPipeline.expire).toHaveBeenCalled()
  })

  it('defaults to 1 when null', async () => {
    mockPipeline.exec.mockResolvedValueOnce([null])

    const count = await incrementBudgetCounter()

    expect(count).toBe(1)
  })
})

describe('getDailyBudget', () => {
  it('returns budget count', async () => {
    mockRedis.get.mockResolvedValueOnce(500)

    const budget = await getDailyBudget()

    expect(budget).toBe(500)
  })

  it('defaults to 0 when no key', async () => {
    mockRedis.get.mockResolvedValueOnce(null)

    const budget = await getDailyBudget()

    expect(budget).toBe(0)
  })
})

describe('recordLevelWin', () => {
  it('stores win with score and timestamp', async () => {
    await recordLevelWin('session-123', 3, 250)

    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining('win:session-123:3'),
      expect.stringContaining('"score":250'),
      expect.objectContaining({ ex: expect.any(Number) })
    )
  })
})

describe('getVerifiedWins', () => {
  it('returns map of level wins', async () => {
    mockPipeline.exec.mockResolvedValueOnce([
      JSON.stringify({ score: 100 }), // level 1
      null, // level 2 (no win)
      JSON.stringify({ score: 200 }), // level 3
      null,
      null,
      null,
      null,
    ])

    const wins = await getVerifiedWins('session-123')

    expect(wins.size).toBe(2)
    expect(wins.get(1)).toBe(100)
    expect(wins.get(3)).toBe(200)
    expect(wins.has(2)).toBe(false)
  })

  it('returns empty map when no wins', async () => {
    mockPipeline.exec.mockResolvedValueOnce([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ])

    const wins = await getVerifiedWins('session-123')

    expect(wins.size).toBe(0)
  })

  it('skips malformed entries gracefully', async () => {
    mockPipeline.exec.mockResolvedValueOnce([
      'not-valid-json{{{',
      JSON.stringify({ score: 150 }),
      null,
      null,
      null,
      null,
      null,
    ])

    const wins = await getVerifiedWins('session-123')

    expect(wins.size).toBe(1)
    expect(wins.get(2)).toBe(150)
  })
})

describe('getTotalAttempts', () => {
  it('sums attempts across all levels', async () => {
    mockPipeline.exec.mockResolvedValueOnce([5, 3, null, 2, null, null, null])

    const total = await getTotalAttempts('session-123')

    expect(total).toBe(10)
  })

  it('returns 0 when no attempts', async () => {
    mockPipeline.exec.mockResolvedValueOnce([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ])

    const total = await getTotalAttempts('session-123')

    expect(total).toBe(0)
  })
})

// exec resolves to [sessionCount, expireResult, ipCount, expireResult]
describe('incrementAttemptCount', () => {
  it('returns the session count when it is the higher one', async () => {
    mockPipeline.exec.mockResolvedValueOnce([7, 1, 2, 0])

    const count = await incrementAttemptCount('session-123', 3, '127.0.0.1')

    expect(count).toBe(7)
  })

  it('returns the IP count for a fresh session id on a known IP', async () => {
    mockPipeline.exec.mockResolvedValueOnce([1, 1, 5, 0])

    const count = await incrementAttemptCount('new-session', 3, '127.0.0.1')

    expect(count).toBe(5)
  })

  it('defaults to 1 when null', async () => {
    mockPipeline.exec.mockResolvedValueOnce([null, null, null, null])

    const count = await incrementAttemptCount('session-123', 1, '127.0.0.1')

    expect(count).toBe(1)
  })
})
