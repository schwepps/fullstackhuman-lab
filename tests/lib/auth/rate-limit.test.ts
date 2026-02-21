import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_MAX_ATTEMPTS } from '@/lib/auth/rate-limit'

// Hoist mock state so it's available inside vi.mock() factories.
// NOTE: This Ratelimit/Upstash mock block is duplicated in rate-limiter.test.ts.
// vi.mock() and vi.hoisted() are Vitest transforms that must be at the top level
// of each test file — they cannot be extracted into shared helpers.
const { mockLimit, redisState } = vi.hoisted(() => ({
  mockLimit: vi.fn(),
  redisState: { available: true },
}))

// Mock next/headers before importing the module under test
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': '1.2.3.4' })),
}))

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    limit(...args: unknown[]) {
      return mockLimit(...args)
    }
    static slidingWindow() {
      return {}
    }
  }
  return { Ratelimit: MockRatelimit }
})

vi.mock('@/lib/upstash', () => ({
  getRedisClient: vi.fn(() => {
    if (!redisState.available) throw new Error('Redis not configured')
    return {}
  }),
}))

describe('checkAuthRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    redisState.available = true
    mockLimit.mockResolvedValue({
      success: true,
      limit: AUTH_MAX_ATTEMPTS,
      remaining: AUTH_MAX_ATTEMPTS - 1,
      reset: 0,
    })
  })

  it('allows requests when Redis returns success', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const allowed = await checkAuthRateLimit()

    expect(allowed).toBe(true)
    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
  })

  it('blocks requests when Redis returns failure', async () => {
    mockLimit.mockResolvedValue({
      success: false,
      limit: AUTH_MAX_ATTEMPTS,
      remaining: 0,
      reset: 0,
    })
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const blocked = await checkAuthRateLimit()

    expect(blocked).toBe(false)
  })

  it('tracks IPs independently via Redis', async () => {
    const { headers } = await import('next/headers')
    const mockHeaders = vi.mocked(headers)
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    await checkAuthRateLimit()
    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')

    // Switch to a different IP
    mockHeaders.mockImplementation(
      async () => new Headers({ 'x-forwarded-for': '5.6.7.8' })
    )

    await checkAuthRateLimit()
    expect(mockLimit).toHaveBeenCalledWith('5.6.7.8')
  })

  it('falls back to in-memory when Redis request fails', async () => {
    mockLimit.mockRejectedValue(new Error('Connection refused'))
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const allowed = await checkAuthRateLimit()

    expect(allowed).toBe(true)
  })

  it('falls back to in-memory when Redis is not configured', async () => {
    redisState.available = false
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const allowed = await checkAuthRateLimit()

    expect(allowed).toBe(true)
  })

  it('in-memory fallback blocks at the limit', async () => {
    redisState.available = false
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    for (let i = 0; i < AUTH_MAX_ATTEMPTS; i++) {
      await checkAuthRateLimit()
    }

    const blocked = await checkAuthRateLimit()

    expect(blocked).toBe(false)
  })

  it('transitions to in-memory fallback when Redis fails mid-session', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    // First call succeeds via Redis
    const first = await checkAuthRateLimit()
    expect(first).toBe(true)
    expect(mockLimit).toHaveBeenCalledTimes(1)

    // Redis starts failing mid-session
    mockLimit.mockRejectedValue(new Error('Connection lost'))

    // Falls back to in-memory, still allows (first in-memory attempt)
    const second = await checkAuthRateLimit()
    expect(second).toBe(true)
    expect(mockLimit).toHaveBeenCalledTimes(2)
  })

  it('returns a boolean', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const result = await checkAuthRateLimit()

    expect(typeof result).toBe('boolean')
  })
})
