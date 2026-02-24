import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Derive a fixed-length HMAC digest from a string value.
 * Used to ensure constant-time comparison regardless of input length.
 */
function hmac(value: string): Buffer {
  return createHmac('sha256', 'webhook-verify').update(value).digest()
}

/**
 * Verify Telegram webhook secret token using constant-time comparison.
 * Both values are HMAC-hashed first so the comparison is always on
 * fixed-length digests — no timing leak on length mismatch.
 */
export function verifyWebhookSecret(receivedToken: string | null): boolean {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!receivedToken || !expectedSecret) return false

  return timingSafeEqual(hmac(expectedSecret), hmac(receivedToken))
}
