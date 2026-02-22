import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  RATE_LIMIT_COOKIE_NAME,
  RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
  MAX_REQUESTS_PER_IP_PER_HOUR,
} from '@/lib/constants/chat'
import { CONSENT_COOKIE_NAME } from '@/lib/constants/legal'
import { TIER_QUOTAS } from '@/lib/constants/quotas'

const MAX_CONVERSATIONS_PER_DAY = TIER_QUOTAS.anonymous.maxConversationsPerDay

// Hoist mock state so it's available inside vi.mock() factories.
// NOTE: This Ratelimit/Upstash mock block is duplicated in rate-limit.test.ts.
// vi.mock() and vi.hoisted() are Vitest transforms that must be at the top level
// of each test file — they cannot be extracted into shared helpers.
const { mockLimit, mockCookieStore, redisState } = vi.hoisted(() => ({
  mockLimit: vi.fn(),
  mockCookieStore: { get: vi.fn(), set: vi.fn() },
  redisState: { available: true },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
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

import {
  checkAnonymousRateLimit,
  recordAnonymousConversation,
} from '@/lib/ai/rate-limiter'

function mockCookies(cookies: Record<string, string | undefined>) {
  mockCookieStore.get.mockImplementation((name: string) => {
    const value = cookies[name]
    return value !== undefined ? { value } : undefined
  })
}

describe('consumeIpRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    redisState.available = true
    mockLimit.mockResolvedValue({
      success: true,
      limit: MAX_REQUESTS_PER_IP_PER_HOUR,
      remaining: MAX_REQUESTS_PER_IP_PER_HOUR - 1,
      reset: 0,
    })
  })

  it('allows requests when Redis returns success', async () => {
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    const result = await consumeIpRequest('1.2.3.4')

    expect(result).toBe(true)
    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
  })

  it('blocks requests when Redis returns failure', async () => {
    mockLimit.mockResolvedValue({
      success: false,
      limit: MAX_REQUESTS_PER_IP_PER_HOUR,
      remaining: 0,
      reset: 0,
    })
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    const result = await consumeIpRequest('1.2.3.4')

    expect(result).toBe(false)
  })

  it('tracks IPs independently via Redis', async () => {
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    await consumeIpRequest('1.2.3.4')
    await consumeIpRequest('5.6.7.8')

    expect(mockLimit).toHaveBeenCalledWith('1.2.3.4')
    expect(mockLimit).toHaveBeenCalledWith('5.6.7.8')
  })

  it('falls back to in-memory when Redis request fails', async () => {
    mockLimit.mockRejectedValue(new Error('Connection refused'))
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    const result = await consumeIpRequest('1.2.3.4')

    expect(result).toBe(true)
  })

  it('falls back to in-memory when Redis is not configured', async () => {
    redisState.available = false
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    const result = await consumeIpRequest('1.2.3.4')

    expect(result).toBe(true)
  })

  it('in-memory fallback blocks at the limit', async () => {
    redisState.available = false
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    for (let i = 0; i < MAX_REQUESTS_PER_IP_PER_HOUR; i++) {
      await consumeIpRequest('1.2.3.4')
    }

    const result = await consumeIpRequest('1.2.3.4')

    expect(result).toBe(false)
  })

  it('transitions to in-memory fallback when Redis fails mid-session', async () => {
    const { consumeIpRequest } = await import('@/lib/ai/rate-limiter')

    // First call succeeds via Redis
    const first = await consumeIpRequest('1.2.3.4')
    expect(first).toBe(true)
    expect(mockLimit).toHaveBeenCalledTimes(1)

    // Redis starts failing mid-session
    mockLimit.mockRejectedValue(new Error('Connection lost'))

    // Falls back to in-memory, still allows (first in-memory attempt)
    const second = await consumeIpRequest('1.2.3.4')
    expect(second).toBe(true)
    expect(mockLimit).toHaveBeenCalledTimes(2)
  })
})

describe('checkAnonymousRateLimit (cookie-based)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows when no cookie exists', async () => {
    mockCookies({})

    const result = await checkAnonymousRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY)
  })

  it('allows when under the limit', async () => {
    const timestamps = [Date.now() - 1000]
    mockCookies({
      [RATE_LIMIT_COOKIE_NAME]: JSON.stringify(timestamps),
    })

    const result = await checkAnonymousRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY - 1)
  })

  it('blocks when at the limit', async () => {
    const timestamps = [Date.now() - 3000, Date.now() - 2000, Date.now() - 1000]
    mockCookies({
      [RATE_LIMIT_COOKIE_NAME]: JSON.stringify(timestamps),
    })

    const result = await checkAnonymousRateLimit()

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('filters out timestamps older than 24 hours', async () => {
    const oldTimestamp =
      Date.now() - RATE_LIMIT_COOKIE_MAX_AGE_SECONDS * 1000 - 1000
    const recentTimestamp = Date.now() - 1000
    mockCookies({
      [RATE_LIMIT_COOKIE_NAME]: JSON.stringify([oldTimestamp, recentTimestamp]),
    })

    const result = await checkAnonymousRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY - 1)
  })

  it('handles malformed cookie JSON gracefully', async () => {
    mockCookies({ [RATE_LIMIT_COOKIE_NAME]: 'not-json' })

    const result = await checkAnonymousRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY)
  })

  it('handles non-array cookie value', async () => {
    mockCookies({ [RATE_LIMIT_COOKIE_NAME]: '"string-value"' })

    const result = await checkAnonymousRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY)
  })
})

describe('recordAnonymousConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets cookie when consent is granted', async () => {
    mockCookies({ [CONSENT_COOKIE_NAME]: 'granted' })

    await recordAnonymousConversation()

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      RATE_LIMIT_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        maxAge: RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
        path: '/',
      })
    )
  })

  it('does not set cookie when consent is denied', async () => {
    mockCookies({ [CONSENT_COOKIE_NAME]: 'denied' })

    await recordAnonymousConversation()

    expect(mockCookieStore.set).not.toHaveBeenCalled()
  })

  it('does not set cookie when consent cookie is absent', async () => {
    mockCookies({})

    await recordAnonymousConversation()

    expect(mockCookieStore.set).not.toHaveBeenCalled()
  })

  it('appends timestamp to existing conversations when consent granted', async () => {
    const existing = [Date.now() - 1000]
    mockCookies({
      [CONSENT_COOKIE_NAME]: 'granted',
      [RATE_LIMIT_COOKIE_NAME]: JSON.stringify(existing),
    })

    await recordAnonymousConversation()

    const setCall = mockCookieStore.set.mock.calls[0]
    const savedTimestamps = JSON.parse(setCall[1] as string) as number[]
    expect(savedTimestamps).toHaveLength(2)
  })
})
