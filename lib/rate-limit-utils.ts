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
