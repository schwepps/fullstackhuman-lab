import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS } from './constants'
import type {
  CriminalRecord,
  ConvictionEntry,
  Confession,
  LeaderboardEntry,
} from './types'

const MAX_CONVICTIONS_STORED = 100

/** Get a member's criminal record */
export async function getRecord(memberId: string): Promise<CriminalRecord> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.record(memberId))

  if (!raw || Object.keys(raw).length === 0) {
    return {
      totalConvictions: 0,
      totalProsecutions: 0,
      totalWins: 0,
      currentAlias: '',
    }
  }

  return {
    totalConvictions: Number(raw.totalConvictions) || 0,
    totalProsecutions: Number(raw.totalProsecutions) || 0,
    totalWins: Number(raw.totalWins) || 0,
    currentAlias: (raw.currentAlias as string) || '',
  }
}

/** Record a conviction */
export async function addConviction(
  memberId: string,
  entry: ConvictionEntry
): Promise<void> {
  const redis = getRedisClient()

  // Increment conviction count
  await redis.hincrby(REDIS_KEYS.record(memberId), 'totalConvictions', 1)

  // Add conviction entry
  await redis.lpush(
    REDIS_KEYS.recordConvictions(memberId),
    JSON.stringify(entry)
  )
  await redis.ltrim(
    REDIS_KEYS.recordConvictions(memberId),
    0,
    MAX_CONVICTIONS_STORED - 1
  )

  // Update leaderboard
  await redis.zincrby(REDIS_KEYS.leaderboardConvictions, 1, memberId)
}

/** Record a prosecution win */
export async function addProsecutionWin(memberId: string): Promise<void> {
  const redis = getRedisClient()
  await redis.hincrby(REDIS_KEYS.record(memberId), 'totalWins', 1)
  await redis.zincrby(REDIS_KEYS.leaderboardWins, 1, memberId)
}

/** Increment prosecution count (participated as accuser) */
export async function addProsecution(memberId: string): Promise<void> {
  const redis = getRedisClient()
  await redis.hincrby(REDIS_KEYS.record(memberId), 'totalProsecutions', 1)
}

/** Get conviction history for a member */
export async function getConvictions(
  memberId: string,
  limit: number = 20
): Promise<ConvictionEntry[]> {
  const redis = getRedisClient()
  const raw = await redis.lrange(
    REDIS_KEYS.recordConvictions(memberId),
    0,
    limit - 1
  )
  return (raw as string[]).map((item) =>
    typeof item === 'string'
      ? (JSON.parse(item) as ConvictionEntry)
      : (item as ConvictionEntry)
  )
}

/** Add a confessional entry */
export async function addConfession(
  memberId: string,
  confession: Confession
): Promise<void> {
  const redis = getRedisClient()
  await redis.lpush(
    REDIS_KEYS.recordConfessions(memberId),
    JSON.stringify(confession)
  )
}

/** Get confessions for a member */
export async function getConfessions(
  memberId: string,
  limit: number = 10
): Promise<Confession[]> {
  const redis = getRedisClient()
  const raw = await redis.lrange(
    REDIS_KEYS.recordConfessions(memberId),
    0,
    limit - 1
  )
  return (raw as string[]).map((item) =>
    typeof item === 'string'
      ? (JSON.parse(item) as Confession)
      : (item as Confession)
  )
}

/** Update member alias */
export async function updateAlias(
  memberId: string,
  alias: string
): Promise<void> {
  const redis = getRedisClient()
  await redis.hset(REDIS_KEYS.record(memberId), { currentAlias: alias })
}

/** Get top convicted members */
export async function getConvictionLeaderboard(
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const redis = getRedisClient()
  const raw = await redis.zrange(
    REDIS_KEYS.leaderboardConvictions,
    0,
    limit - 1,
    {
      rev: true,
      withScores: true,
    }
  )

  const entries: LeaderboardEntry[] = []
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({
      memberId: raw[i] as string,
      memberName: '', // Filled by caller from MEMBERS
      count: Number(raw[i + 1]),
    })
  }
  return entries
}

/** Get top prosecutors */
export async function getWinsLeaderboard(
  limit: number = 20
): Promise<LeaderboardEntry[]> {
  const redis = getRedisClient()
  const raw = await redis.zrange(REDIS_KEYS.leaderboardWins, 0, limit - 1, {
    rev: true,
    withScores: true,
  })

  const entries: LeaderboardEntry[] = []
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({
      memberId: raw[i] as string,
      memberName: '',
      count: Number(raw[i + 1]),
    })
  }
  return entries
}
