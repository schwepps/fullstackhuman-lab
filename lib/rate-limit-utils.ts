import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { getRedisClient } from '@/lib/upstash'

const DEFAULT_MAX_MAP_ENTRIES = 10_000

/**
 * Evict expired entries when a timestamp Map exceeds size cap.
 * Prevents memory exhaustion from accumulating stale entries.
 */
export function pruneTimestampMap(
  map: Map<string, number[]>,
  windowMs: number,
  maxEntries = DEFAULT_MAX_MAP_ENTRIES
): void {
  if (map.size <= maxEntries) return
  const cutoff = Date.now() - windowMs
  for (const [key, timestamps] of map) {
    const recent = timestamps.filter((ts) => ts > cutoff)
    if (recent.length === 0) map.delete(key)
    else map.set(key, recent)
  }
  // If still over limit after pruning expired, evict oldest entries
  if (map.size > maxEntries) {
    let toDelete = map.size - maxEntries
    for (const key of map.keys()) {
      if (toDelete <= 0) break
      map.delete(key)
      toDelete--
    }
  }
}

/**
 * Atomically check rate limit and record the attempt in a single call.
 * Returns true if the request is allowed, false if rate-limited.
 * Eliminates TOCTOU gaps from separate check/record calls.
 */
export function consumeFromTimestampMap(
  map: Map<string, number[]>,
  key: string,
  windowMs: number,
  maxPerWindow: number,
  maxEntries = DEFAULT_MAX_MAP_ENTRIES
): boolean {
  pruneTimestampMap(map, windowMs, maxEntries)

  const now = Date.now()
  const cutoff = now - windowMs
  const timestamps = map.get(key) ?? []
  const recent = timestamps.filter((ts) => ts > cutoff)

  if (recent.length >= maxPerWindow) {
    map.set(key, recent)
    return false
  }

  recent.push(now)
  map.set(key, recent)
  return true
}

// --- Redis-backed rate limiting ---

interface RateLimiterConfig {
  maxRequests: number
  window: Duration
  prefix: string
}

/**
 * Create a lazy-initialized Ratelimit singleton backed by Upstash Redis.
 * Returns a getter that initializes the limiter on first call.
 * If Redis is not configured (missing env vars), logs a warning and returns null.
 */
export function createLazyRateLimiter(
  config: RateLimiterConfig
): () => Ratelimit | null {
  let limiter: Ratelimit | null = null
  return () => {
    if (limiter) return limiter
    try {
      limiter = new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(config.maxRequests, config.window),
        prefix: config.prefix,
      })
      return limiter
    } catch {
      console.warn(
        `[rate-limit] Redis unavailable for ${config.prefix}, using in-memory fallback`
      )
      return null
    }
  }
}

/**
 * Try Redis rate limiting first, fall back to in-memory on failure.
 *
 * Design decision: fail-open. If Redis is unreachable, requests are allowed
 * through the in-memory fallback. In serverless environments, each cold start
 * resets the in-memory Map, providing reduced but non-zero protection.
 * This trade-off prioritizes availability over strict rate enforcement —
 * acceptable for a consulting tool where blocking all users is worse than
 * temporarily relaxed limits.
 */
export async function consumeWithFallback(
  limiter: Ratelimit | null,
  key: string,
  fallbackMap: Map<string, number[]>,
  windowMs: number,
  maxPerWindow: number
): Promise<boolean> {
  if (limiter) {
    try {
      const { success } = await limiter.limit(key)
      return success
    } catch {
      console.warn(
        '[rate-limit] Redis request failed, falling back to in-memory'
      )
    }
  }
  return consumeFromTimestampMap(fallbackMap, key, windowMs, maxPerWindow)
}
