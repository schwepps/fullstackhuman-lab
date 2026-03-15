import { getRedisClient } from './upstash'
import { REDIS_KEYS, TTL_RESULT } from './constants'
import type { EvaluationResult } from './types'

export async function saveResult(result: EvaluationResult): Promise<void> {
  const redis = getRedisClient()
  await redis.set(REDIS_KEYS.result(result.id), JSON.stringify(result), {
    ex: TTL_RESULT,
  })
}

export async function getResult(id: string): Promise<EvaluationResult | null> {
  const redis = getRedisClient()
  const raw = await redis.get<string>(REDIS_KEYS.result(id))
  if (!raw) return null

  // Redis may return already-parsed object or string depending on client
  if (typeof raw === 'object') return raw as unknown as EvaluationResult
  return JSON.parse(raw) as EvaluationResult
}

export async function incrementStats(): Promise<void> {
  const redis = getRedisClient()
  await redis.incr(REDIS_KEYS.statsTotal)
}
