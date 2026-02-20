import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_MAX_ATTEMPTS } from '@/lib/auth/rate-limit'

// Mock next/headers before importing the module under test
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': '1.2.3.4' })),
}))

describe('checkAuthRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('allows requests under the limit', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const allowed = await checkAuthRateLimit()

    expect(allowed).toBe(true)
  })

  it('allows up to 10 requests within the window', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    for (let i = 0; i < AUTH_MAX_ATTEMPTS; i++) {
      const allowed = await checkAuthRateLimit()
      expect(allowed).toBe(true)
    }
  })

  it('blocks the 11th request (exceeds limit of 10)', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    // Consume all 10 allowed attempts
    for (let i = 0; i < AUTH_MAX_ATTEMPTS; i++) {
      await checkAuthRateLimit()
    }

    const blocked = await checkAuthRateLimit()
    expect(blocked).toBe(false)
  })

  it('tracks IPs independently', async () => {
    const { headers } = await import('next/headers')
    const mockHeaders = vi.mocked(headers)

    // First, import the module with the default IP
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    // Exhaust the limit for IP 1.2.3.4
    for (let i = 0; i < AUTH_MAX_ATTEMPTS; i++) {
      await checkAuthRateLimit()
    }

    const blockedForFirstIp = await checkAuthRateLimit()
    expect(blockedForFirstIp).toBe(false)

    // Switch to a different IP
    mockHeaders.mockImplementation(
      async () => new Headers({ 'x-forwarded-for': '5.6.7.8' })
    )

    const allowedForSecondIp = await checkAuthRateLimit()
    expect(allowedForSecondIp).toBe(true)
  })

  it('returns a boolean', async () => {
    const { checkAuthRateLimit } = await import('@/lib/auth/rate-limit')

    const result = await checkAuthRateLimit()

    expect(typeof result).toBe('boolean')
  })
})
