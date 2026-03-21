import 'server-only'
import { getRedisClient } from './upstash'
import { REDIS_KEYS, SESSION_TTL_SECONDS } from './constants'
import { MEMBERS } from './members'

/**
 * Server-side character locking via Redis.
 * Each member can only be claimed by one session at a time.
 * Claims expire after 24h to prevent permanent lockout.
 */

/** Claim a member for a session. Returns true if successful. */
export async function claimMember(
  memberId: string,
  sessionId: string
): Promise<boolean> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.session(memberId)

  // Check if already claimed by this session (allow re-entry)
  const existing = await redis.get(key)
  if (existing === sessionId) {
    // Refresh TTL
    await redis.expire(key, SESSION_TTL_SECONDS)
    return true
  }

  // Try to claim with SET NX (atomic)
  const acquired = await redis.set(key, sessionId, {
    nx: true,
    ex: SESSION_TTL_SECONDS,
  })

  return acquired !== null
}

/** Release a member claim */
export async function releaseMember(
  memberId: string,
  sessionId: string
): Promise<void> {
  const redis = getRedisClient()
  const key = REDIS_KEYS.session(memberId)

  // Only release if we own the claim
  const existing = await redis.get(key)
  if (existing === sessionId) {
    await redis.del(key)
  }
}

/** Get all currently claimed member IDs with their session IDs */
export async function getClaimedMembers(): Promise<Record<string, string>> {
  const redis = getRedisClient()
  const claims: Record<string, string> = {}

  // Check each member in parallel
  const results = await Promise.all(
    MEMBERS.map(async (m) => {
      const sessionId = await redis.get(REDIS_KEYS.session(m.id))
      return { memberId: m.id, sessionId }
    })
  )

  for (const { memberId, sessionId } of results) {
    if (sessionId) {
      claims[memberId] = sessionId as string
    }
  }

  return claims
}
