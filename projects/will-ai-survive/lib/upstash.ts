import type { Redis } from '@upstash/redis'
import { Redis as CloudflareRedis } from '@upstash/redis/cloudflare'

let redis: Redis | null = null

/**
 * Lazy singleton for the Upstash Redis client.
 * Throws if credentials are missing — callers should catch
 * and fall back to in-memory rate limiting for local dev.
 *
 * IMPORTANT: Always use the Cloudflare adapter. The Node.js adapter
 * hardcodes `cache: 'no-store'` which crashes in Cloudflare Workers
 * (Partykit runtime). Runtime detection (typeof process) is unreliable
 * because Partykit's esbuild bundler injects process polyfills.
 * The Cloudflare adapter works in both Node.js and workerd — it simply
 * omits the `cache` option from fetch calls.
 *
 * GDPR note: Rate limiting stores IP addresses as Redis keys with
 * sliding window TTLs (1h for chat, 15m for auth). Keys expire
 * automatically — no manual cleanup needed. Select EU (Frankfurt)
 * region when creating the Upstash database.
 */
export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required. Add them to your .env.local file.'
      )
    }
    // Always use CloudflareRedis — works in both Node.js and workerd
    redis = new CloudflareRedis({ url, token }) as unknown as Redis
  }
  return redis
}
