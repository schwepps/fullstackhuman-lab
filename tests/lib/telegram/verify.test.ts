import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { verifyWebhookSecret } from '@/lib/telegram/verify'

describe('verifyWebhookSecret', () => {
  const ORIGINAL_ENV = process.env.TELEGRAM_WEBHOOK_SECRET

  beforeEach(() => {
    // Set a known secret for most tests
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret-abc123'
  })

  afterEach(() => {
    // Restore original env
    if (ORIGINAL_ENV !== undefined) {
      process.env.TELEGRAM_WEBHOOK_SECRET = ORIGINAL_ENV
    } else {
      delete process.env.TELEGRAM_WEBHOOK_SECRET
    }
  })

  it('returns true when received token matches the expected secret', () => {
    expect(verifyWebhookSecret('test-webhook-secret-abc123')).toBe(true)
  })

  it('returns false when received token does not match', () => {
    expect(verifyWebhookSecret('wrong-secret')).toBe(false)
  })

  it('returns false when received token is null', () => {
    expect(verifyWebhookSecret(null)).toBe(false)
  })

  it('returns false when env var is not set', () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET
    expect(verifyWebhookSecret('any-token')).toBe(false)
  })

  it('returns false when env var is empty string', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = ''
    expect(verifyWebhookSecret('any-token')).toBe(false)
  })

  it('returns false when both token and env var are empty', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = ''
    expect(verifyWebhookSecret('')).toBe(false)
  })

  it('returns false when token differs from secret', () => {
    // HMAC digests are fixed-length, so comparison always runs constant-time
    expect(verifyWebhookSecret('short')).toBe(false)
  })

  it('returns false for token with same length but different content', () => {
    const secret = 'test-webhook-secret-abc123'
    const sameLength = 'x'.repeat(secret.length)
    expect(verifyWebhookSecret(sameLength)).toBe(false)
  })

  it('handles unicode characters in secret', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'secret-\u00e9\u00e0\u00fc'
    expect(verifyWebhookSecret('secret-\u00e9\u00e0\u00fc')).toBe(true)
    expect(verifyWebhookSecret('secret-eaf')).toBe(false)
  })

  it('is case-sensitive', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'MySecret'
    expect(verifyWebhookSecret('mysecret')).toBe(false)
    expect(verifyWebhookSecret('MYSECRET')).toBe(false)
    expect(verifyWebhookSecret('MySecret')).toBe(true)
  })
})
