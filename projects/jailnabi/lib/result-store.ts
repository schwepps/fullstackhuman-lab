import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS, RESULT_TTL_SECONDS } from './constants'
import type { ShareableResult } from './types'

/** Get a shareable result by ID */
export async function getResult(id: string): Promise<ShareableResult | null> {
  const redis = getRedisClient()
  const raw = await redis.get(REDIS_KEYS.result(id))
  if (!raw) return null
  return typeof raw === 'string'
    ? (JSON.parse(raw) as ShareableResult)
    : (raw as ShareableResult)
}

/** Save a shareable result */
export async function saveResult(result: ShareableResult): Promise<void> {
  const redis = getRedisClient()
  await redis.set(REDIS_KEYS.result(result.id), JSON.stringify(result), {
    ex: RESULT_TTL_SECONDS,
  })
}
