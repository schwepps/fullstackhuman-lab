import type { Redis } from '@upstash/redis'
import { Redis as CloudflareRedis } from '@upstash/redis/cloudflare'

let redis: Redis | null = null

/**
 * Lazy singleton for the Upstash Redis client. Throws if credentials are missing.
 *
 * The Cloudflare adapter is deliberate: it omits the fetch `cache` option,
 * so it runs in both Node.js and edge runtimes (the OG route runs on edge).
 *
 * GDPR note: rate-limit keys contain IP addresses and expire after 1 hour
 * (hourly limit) or 24 hours (daily limit). Use the EU (Frankfurt) region.
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
    redis = new CloudflareRedis({ url, token }) as unknown as Redis
  }
  return redis
}
