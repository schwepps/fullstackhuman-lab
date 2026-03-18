import { getRedisClient } from './upstash'
import { REDIS_KEYS, TTL_RESULT_SECONDS } from './constants'
import type { ShareableResult } from './types'

export async function saveResult(result: ShareableResult): Promise<void> {
  const redis = getRedisClient()
  await redis.set(REDIS_KEYS.result(result.id), JSON.stringify(result), {
    ex: TTL_RESULT_SECONDS,
  })
}

export async function getResult(id: string): Promise<ShareableResult | null> {
  const redis = getRedisClient()
  const raw = await redis.get<string>(REDIS_KEYS.result(id))
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as ShareableResult)
  } catch {
    return null
  }
}
