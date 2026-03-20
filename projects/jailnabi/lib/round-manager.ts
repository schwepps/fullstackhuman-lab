import 'server-only'
import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  DEFENSE_DEADLINE_MS,
  MAX_ROUNDS_HISTORY,
} from './constants'
import type { Round, RoundPhase, Evidence, Defense } from './types'
import { markCrimeUsed } from './crime-pool'
import { nanoid } from 'nanoid'

/**
 * Round lifecycle state machine.
 *
 * IDLE → PROSECUTION → DEFENSE → DELIBERATION → VERDICT → CLOSED
 * Transitions are manual ("Call the Court") with minimum thresholds.
 */

/** Get the current active round */
export async function getCurrentRound(): Promise<Round | null> {
  const redis = getRedisClient()
  const roundId = await redis.get(REDIS_KEYS.currentRound)
  if (!roundId) return null

  const raw = await redis.hgetall(REDIS_KEYS.round(roundId as string))
  if (!raw || Object.keys(raw).length === 0) return null

  return parseRound(raw)
}

/** Start a new round with the given crime. Uses SETNX for atomicity. */
export async function startRound(
  crimeId: string,
  crimeText: string
): Promise<Round> {
  const redis = getRedisClient()

  // Determine skill index from round history length
  const historyLength = await redis.llen(REDIS_KEYS.roundsHistory)
  const skillIndex = historyLength ?? 0

  const round: Round = {
    id: nanoid(12),
    phase: 'prosecution',
    crimeId,
    crimeText,
    skillIndex,
    startedAt: new Date().toISOString(),
    defenseDeadline: null,
    convictId: null,
  }

  // Store round data first
  await redis.hset(REDIS_KEYS.round(round.id), roundToHash(round))

  // Atomic check: only set current round if none exists (or previous is closed)
  const currentId = await redis.get(REDIS_KEYS.currentRound)
  if (currentId) {
    const existing = await redis.hget(
      REDIS_KEYS.round(currentId as string),
      'phase'
    )
    if (existing && existing !== 'closed') {
      // Cleanup the round we just created
      await redis.del(REDIS_KEYS.round(round.id))
      throw new Error('A round is already in progress')
    }
  }

  await redis.set(REDIS_KEYS.currentRound, round.id)

  // Mark crime as used
  await markCrimeUsed(crimeId)

  // Add to history
  await redis.lpush(REDIS_KEYS.roundsHistory, round.id)
  await redis.ltrim(REDIS_KEYS.roundsHistory, 0, MAX_ROUNDS_HISTORY - 1)

  return round
}

/** Advance the round to the next phase. Uses compare-and-swap on phase field. */
export async function advancePhase(roundId: string): Promise<Round> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.round(roundId))
  if (!raw || Object.keys(raw).length === 0) {
    throw new Error('Round not found')
  }

  const round = parseRound(raw)
  const currentPhase = round.phase

  switch (round.phase) {
    case 'prosecution': {
      const defenseDeadline = new Date(
        Date.now() + DEFENSE_DEADLINE_MS
      ).toISOString()
      round.phase = 'defense'
      round.defenseDeadline = defenseDeadline
      break
    }
    case 'defense':
      round.phase = 'deliberation'
      break
    case 'deliberation':
      round.phase = 'verdict'
      break
    case 'verdict':
      round.phase = 'closed'
      break
    default:
      throw new Error(`Cannot advance from phase: ${round.phase}`)
  }

  // Compare-and-swap: only update if phase hasn't changed since we read it
  const verifyPhase = await redis.hget(REDIS_KEYS.round(roundId), 'phase')
  if (verifyPhase !== currentPhase) {
    throw new Error('Phase already advanced by another request')
  }

  await redis.hset(REDIS_KEYS.round(roundId), roundToHash(round))
  return round
}

/** Set the convict ID on a round */
export async function setConvict(
  roundId: string,
  convictId: string
): Promise<void> {
  const redis = getRedisClient()
  await redis.hset(REDIS_KEYS.round(roundId), { convictId })
}

/** Get all evidence for a round */
export async function getRoundEvidence(roundId: string): Promise<Evidence[]> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.roundEvidence(roundId))
  if (!raw) return []

  return Object.values(raw).map((v) =>
    typeof v === 'string' ? (JSON.parse(v) as Evidence) : (v as Evidence)
  )
}

/** Store evidence for a round */
export async function storeEvidence(
  roundId: string,
  accuserId: string,
  evidence: Evidence
): Promise<void> {
  const redis = getRedisClient()
  await redis.hset(REDIS_KEYS.roundEvidence(roundId), {
    [accuserId]: JSON.stringify(evidence),
  })
}

/** Get defense for a round (keyed by defender ID) */
export async function getRoundDefenses(
  roundId: string
): Promise<Record<string, Defense>> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.roundDefense(roundId))
  if (!raw) return {}

  const result: Record<string, Defense> = {}
  for (const [key, val] of Object.entries(raw)) {
    result[key] =
      typeof val === 'string' ? (JSON.parse(val) as Defense) : (val as Defense)
  }
  return result
}

/** Store a defense for a round */
export async function storeDefense(
  roundId: string,
  defenderId: string,
  defense: Defense
): Promise<void> {
  const redis = getRedisClient()
  await redis.hset(REDIS_KEYS.roundDefense(roundId), {
    [defenderId]: JSON.stringify(defense),
  })
}

/** Get recent round IDs */
export async function getRecentRoundIds(limit: number = 10): Promise<string[]> {
  const redis = getRedisClient()
  const ids = await redis.lrange(REDIS_KEYS.roundsHistory, 0, limit - 1)
  return ids as string[]
}

// ── Helpers ──────────────────────────────────────────────────────

function roundToHash(round: Round): Record<string, string> {
  return {
    id: round.id,
    phase: round.phase,
    crimeId: round.crimeId,
    crimeText: round.crimeText,
    skillIndex: String(round.skillIndex),
    startedAt: round.startedAt,
    defenseDeadline: round.defenseDeadline ?? '',
    convictId: round.convictId ?? '',
  }
}

function parseRound(raw: Record<string, unknown>): Round {
  return {
    id: raw.id as string,
    phase: raw.phase as RoundPhase,
    crimeId: raw.crimeId as string,
    crimeText: raw.crimeText as string,
    skillIndex: Number(raw.skillIndex),
    startedAt: raw.startedAt as string,
    defenseDeadline: (raw.defenseDeadline as string) || null,
    convictId: (raw.convictId as string) || null,
  }
}
