import type { Redis } from '@upstash/redis'
import { Redis as CloudflareRedis } from '@upstash/redis/cloudflare'

let redis: Redis | null = null

/**
 * Lazy singleton for the Upstash Redis client.
 * Uses the Cloudflare adapter which works in both Node.js and workerd.
 *
 * GDPR note: Rate limiting stores IP addresses as Redis keys with
 * sliding window TTLs. Keys expire automatically — no manual cleanup.
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
