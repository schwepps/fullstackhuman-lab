import { getRedisClient } from './upstash'
import { REDIS_PREFIX } from './constants'
import type { ShareableResult } from './types'

const RESULT_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

export async function saveResult(result: ShareableResult): Promise<void> {
  const redis = getRedisClient()
  await redis.set(
    `${REDIS_PREFIX}result:${result.id}`,
    JSON.stringify(result),
    { ex: RESULT_TTL_SECONDS }
  )
}

export async function getResult(id: string): Promise<ShareableResult | null> {
  const redis = getRedisClient()
  const raw = await redis.get<string>(`${REDIS_PREFIX}result:${id}`)
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as ShareableResult)
  } catch {
    return null
  }
}
