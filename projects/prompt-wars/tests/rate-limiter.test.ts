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

describe('checkAttemptAllowed', () => {
  it('allows attempt when under all limits', async () => {
    mockPipeline.exec.mockResolvedValueOnce([0, 0]) // globalCount=0, levelCount=0

    const result = await checkAttemptAllowed('127.0.0.1', 1)

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('rejects when global limit is reached', async () => {
    mockPipeline.exec.mockResolvedValueOnce([30, 0]) // globalCount=30 (at limit)

    const result = await checkAttemptAllowed('127.0.0.1', 1)

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('SYSTEM LOCKOUT')
    expect(result.retryAfterSeconds).toBeDefined()
  })

  it('rejects when per-level limit is reached for basic levels', async () => {
    mockPipeline.exec.mockResolvedValueOnce([0, 10]) // levelCount=10 (at limit)

    const result = await checkAttemptAllowed('127.0.0.1', 3)

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('FIREWALL COOLDOWN')
  })

  it('uses stricter limit for advanced levels (6+)', async () => {
    // 5 attempts blocks advanced levels but not basic ones
    mockPipeline.exec.mockResolvedValueOnce([0, 5])

    const result = await checkAttemptAllowed('127.0.0.1', 6)

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('FIREWALL COOLDOWN')
  })

  it('allows 5 attempts on basic levels', async () => {
    mockPipeline.exec.mockResolvedValueOnce([0, 5])

    const result = await checkAttemptAllowed('127.0.0.1', 3)

    expect(result.allowed).toBe(true)
  })

  it('increments counters and sets TTL when allowed', async () => {
    mockPipeline.exec.mockResolvedValueOnce([0, 0])

    await checkAttemptAllowed('127.0.0.1', 1)

    // Second pipeline call should increment + expire
    expect(mockRedis.pipeline).toHaveBeenCalledTimes(2)
    expect(mockPipeline.incr).toHaveBeenCalledTimes(2) // global + level
    expect(mockPipeline.expire).toHaveBeenCalledTimes(2)
  })

  it('does not increment counters when rejected', async () => {
    mockPipeline.exec.mockResolvedValueOnce([30, 0]) // global limit hit

    await checkAttemptAllowed('127.0.0.1', 1)

    // Only one pipeline call (the read), no increment
    expect(mockRedis.pipeline).toHaveBeenCalledTimes(1)
  })

  it('handles null counters as 0', async () => {
    mockPipeline.exec.mockResolvedValueOnce([null, null])

    const result = await checkAttemptAllowed('127.0.0.1', 1)

    expect(result.allowed).toBe(true)
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

describe('incrementAttemptCount', () => {
  it('increments and returns count', async () => {
    mockPipeline.exec.mockResolvedValueOnce([7])

    const count = await incrementAttemptCount('session-123', 3)

    expect(count).toBe(7)
    expect(mockPipeline.incr).toHaveBeenCalled()
    expect(mockPipeline.expire).toHaveBeenCalled()
  })

  it('defaults to 1 when null', async () => {
    mockPipeline.exec.mockResolvedValueOnce([null])

    const count = await incrementAttemptCount('session-123', 1)

    expect(count).toBe(1)
  })
})
