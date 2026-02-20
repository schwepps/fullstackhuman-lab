import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MAX_CONVERSATIONS_PER_DAY,
  RATE_LIMIT_COOKIE_NAME,
  RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/constants/chat'

// Mock next/headers before importing rate-limiter
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
}))

import { checkRateLimit, recordConversationStart } from '@/lib/ai/rate-limiter'

describe('checkIpRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module to clear in-memory IP store
    vi.resetModules()
  })

  it('allows requests under the limit', async () => {
    const { checkIpRateLimit: check } = await import('@/lib/ai/rate-limiter')
    expect(check('1.2.3.4')).toBe(true)
  })

  it('blocks requests at the limit (60/hour)', async () => {
    const { checkIpRateLimit: check, recordIpRequest: record } =
      await import('@/lib/ai/rate-limiter')

    // Record 60 requests
    for (let i = 0; i < 60; i++) {
      record('1.2.3.4')
    }

    expect(check('1.2.3.4')).toBe(false)
  })

  it('tracks IPs independently', async () => {
    const { checkIpRateLimit: check, recordIpRequest: record } =
      await import('@/lib/ai/rate-limiter')

    for (let i = 0; i < 60; i++) {
      record('1.2.3.4')
    }

    expect(check('1.2.3.4')).toBe(false)
    expect(check('5.6.7.8')).toBe(true)
  })
})

describe('checkRateLimit (cookie-based)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows when no cookie exists', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    const result = await checkRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY)
  })

  it('allows when under the limit', async () => {
    const timestamps = [Date.now() - 1000]
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(timestamps),
    })

    const result = await checkRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY - 1)
  })

  it('blocks when at the limit', async () => {
    const timestamps = [Date.now() - 3000, Date.now() - 2000, Date.now() - 1000]
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(timestamps),
    })

    const result = await checkRateLimit()

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('filters out timestamps older than 24 hours', async () => {
    const oldTimestamp =
      Date.now() - RATE_LIMIT_COOKIE_MAX_AGE_SECONDS * 1000 - 1000
    const recentTimestamp = Date.now() - 1000
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify([oldTimestamp, recentTimestamp]),
    })

    const result = await checkRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY - 1)
  })

  it('handles malformed cookie JSON gracefully', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'not-json' })

    const result = await checkRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY)
  })

  it('handles non-array cookie value', async () => {
    mockCookieStore.get.mockReturnValue({ value: '"string-value"' })

    const result = await checkRateLimit()

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(MAX_CONVERSATIONS_PER_DAY)
  })
})

describe('recordConversationStart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets cookie with correct options', async () => {
    mockCookieStore.get.mockReturnValue(undefined)

    await recordConversationStart()

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

  it('appends timestamp to existing conversations', async () => {
    const existing = [Date.now() - 1000]
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(existing),
    })

    await recordConversationStart()

    const setCall = mockCookieStore.set.mock.calls[0]
    const savedTimestamps = JSON.parse(setCall[1] as string) as number[]
    expect(savedTimestamps).toHaveLength(2)
  })
})
