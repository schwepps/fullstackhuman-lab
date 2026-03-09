import { getRedisClient } from '../upstash'
import { roomStore } from './room-store'
import {
  MAX_CONCURRENT_ROOMS,
  MAX_ROOMS_PER_IP_PER_HOUR,
  MAX_MESSAGES_PER_MINUTE,
  AGENT_RESPONSE_COOLDOWN_MS,
} from './constants'

export async function checkRoomCreationAllowed(
  ip: string
): Promise<{ allowed: boolean; reason?: string }> {
  const redis = getRedisClient()
  const currentRooms = await roomStore.getConcurrentCount()
  if (currentRooms >= MAX_CONCURRENT_ROOMS) {
    return {
      allowed: false,
      reason: 'Server at capacity. Try in a few minutes.',
    }
  }

  const ipKey = `game:ratelimit:create:${ip}`
  const count = await redis.incr(ipKey)
  if (count === 1) await redis.expire(ipKey, 3600)
  if (count > MAX_ROOMS_PER_IP_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Too many rooms created. Try again in an hour.',
    }
  }

  return { allowed: true }
}

export async function checkMessageRateAllowed(
  playerId: string
): Promise<boolean> {
  const redis = getRedisClient()
  const key = `game:ratelimit:msg:${playerId}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 60)
  return count <= MAX_MESSAGES_PER_MINUTE
}

export async function checkAgentCooldown(
  roomId: string,
  zone: string
): Promise<boolean> {
  const redis = getRedisClient()
  const key = `game:agentcooldown:${roomId}:${zone}`
  const exists = await redis.exists(key)
  if (exists) return false
  await redis.set(key, '1', { px: AGENT_RESPONSE_COOLDOWN_MS })
  return true
}
