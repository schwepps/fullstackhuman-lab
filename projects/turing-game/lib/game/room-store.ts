import { getRedisClient } from '../upstash'
import { ROOM_TTL, MAX_CHAT_HISTORY_PER_ZONE } from './constants'
import type { Room, Player } from './types'

function serialise(room: Room): string {
  return JSON.stringify({
    ...room,
    players: Object.fromEntries(
      Array.from(room.players.entries()).map(([k, v]) => [
        k,
        {
          ...v,
          chatHistory: v.chatHistory.map((z) => ({
            ...z,
            messages: z.messages.slice(-MAX_CHAT_HISTORY_PER_ZONE),
          })),
        },
      ])
    ),
    votes: Object.fromEntries(room.votes),
    results: room.results ?? undefined,
  })
}

function deserialise(raw: string | Record<string, unknown>): Room {
  // Upstash auto-deserializes JSON by default — raw may already be an object
  const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
  return {
    ...obj,
    players: new Map(
      Object.entries(obj.players as Record<string, Player>).map(([k, v]) => [
        k,
        v,
      ])
    ),
    votes: new Map(Object.entries(obj.votes as Record<string, string>)),
    results: obj.results ?? undefined,
  }
}

export const roomStore = {
  async create(room: Room): Promise<void> {
    const redis = getRedisClient()
    await redis.set(`game:room:${room.id}`, serialise(room), {
      ex: ROOM_TTL,
    })
  },

  async get(id: string): Promise<Room | null> {
    const redis = getRedisClient()
    const raw = await redis.get<string | Record<string, unknown>>(
      `game:room:${id}`
    )
    if (!raw) return null
    return deserialise(raw)
  },

  async update(
    id: string,
    updater: (room: Room) => Room,
    retries = 3
  ): Promise<Room> {
    const redis = getRedisClient()
    const key = `game:room:${id}`

    for (let attempt = 0; attempt < retries; attempt++) {
      const raw = await redis.get<string | Record<string, unknown>>(key)
      if (!raw) throw new Error(`Room ${id} not found`)

      const room = deserialise(raw)
      const updated = updater(room)
      const newVal = serialise(updated)

      // For optimistic lock comparison, we need the string as stored in Redis
      const rawStr = typeof raw === 'string' ? raw : JSON.stringify(raw)

      // Optimistic lock: only SET if the value hasn't changed since we read it
      // Uses a Lua script for atomicity: compare old value, set if unchanged
      const success = await redis.eval<string[], number>(
        `if redis.call('GET', KEYS[1]) == ARGV[1] then
          redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
          return 1
        else
          return 0
        end`,
        [key],
        [rawStr, newVal, String(ROOM_TTL)]
      )

      if (success === 1) return updated

      // Conflict — retry with fresh data
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 100))
      }
    }

    // Fallback: force write after retries exhausted (prefer stale write over failure)
    const room = await roomStore.get(id)
    if (!room) throw new Error(`Room ${id} not found`)
    const updated = updater(room)
    await redis.set(key, serialise(updated), { ex: ROOM_TTL })
    return updated
  },

  async delete(id: string): Promise<void> {
    const redis = getRedisClient()
    await redis.del(`game:room:${id}`)
  },

  async getConcurrentCount(): Promise<number> {
    const redis = getRedisClient()
    // Use SCAN to count actual room keys — immune to TTL drift
    let cursor = '0'
    let count = 0
    do {
      const result: [string, string[]] = await redis.scan(cursor, {
        match: 'game:room:*',
        count: 100,
      })
      cursor = result[0]
      count += result[1].length
    } while (cursor !== '0')
    return count
  },
}

export { serialise as _serialise, deserialise as _deserialise }
