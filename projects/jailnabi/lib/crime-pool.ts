import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS, MAX_CRIMES_IN_POOL } from './constants'
import type { Crime } from './types'
import { nanoid } from 'nanoid'

/**
 * Crime pool management.
 * Crime IDs stored in a Redis LIST (pool), full details in individual STRING keys.
 */

/** Submit a new crime to the pool */
export async function submitCrime(
  text: string,
  submittedBy: string
): Promise<Crime> {
  const redis = getRedisClient()

  const crime: Crime = {
    id: nanoid(12),
    text,
    submittedBy,
    submittedAt: new Date().toISOString(),
    used: false,
  }

  // Store crime detail + add ID to pool
  await redis.set(REDIS_KEYS.crime(crime.id), JSON.stringify(crime))
  await redis.lpush(REDIS_KEYS.crimes, crime.id)
  await redis.ltrim(REDIS_KEYS.crimes, 0, MAX_CRIMES_IN_POOL - 1)

  return crime
}

/** Get all unused crimes from the pool */
export async function getAvailableCrimes(): Promise<Crime[]> {
  const redis = getRedisClient()
  const ids = (await redis.lrange(REDIS_KEYS.crimes, 0, -1)) as string[]

  const crimes = await Promise.all(ids.map((id) => getCrime(id)))
  return crimes.filter((c): c is Crime => c != null && !c.used)
}

/** Mark a crime as used */
export async function markCrimeUsed(crimeId: string): Promise<void> {
  const redis = getRedisClient()
  const crime = await getCrime(crimeId)
  if (!crime) return

  crime.used = true
  await redis.set(REDIS_KEYS.crime(crimeId), JSON.stringify(crime))
}

/** Get a specific crime by ID */
export async function getCrime(crimeId: string): Promise<Crime | null> {
  const redis = getRedisClient()
  const raw = await redis.get(REDIS_KEYS.crime(crimeId))
  if (!raw) return null
  return typeof raw === 'string' ? (JSON.parse(raw) as Crime) : (raw as Crime)
}
