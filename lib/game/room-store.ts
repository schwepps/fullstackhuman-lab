import { getRedisClient } from '@/lib/upstash'
import { ROOM_TTL, MAX_CHAT_HISTORY_PER_ZONE } from '@/lib/game/constants'
import type { Room, Player } from '@/lib/game/types'

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
    results: room.results
      ? {
          ...room.results,
          scores: Object.fromEntries(room.results.scores),
        }
      : undefined,
  })
}

function deserialise(raw: string): Room {
  const obj = JSON.parse(raw)
  return {
    ...obj,
    players: new Map(
      Object.entries(obj.players as Record<string, Player>).map(([k, v]) => [
        k,
        v,
      ])
    ),
    votes: new Map(Object.entries(obj.votes as Record<string, string>)),
    results: obj.results
      ? {
          ...obj.results,
          scores: new Map(
            Object.entries(obj.results.scores as Record<string, number>)
          ),
        }
      : undefined,
  }
}

export const roomStore = {
  async create(room: Room): Promise<void> {
    const redis = getRedisClient()
    await redis.set(`game:room:${room.id}`, serialise(room), {
      ex: ROOM_TTL,
    })
    await redis.incr('game:room:count')
  },

  async get(id: string): Promise<Room | null> {
    const redis = getRedisClient()
    const raw = await redis.get<string>(`game:room:${id}`)
    return raw ? deserialise(raw) : null
  },

  async update(id: string, updater: (room: Room) => Room): Promise<Room> {
    const room = await roomStore.get(id)
    if (!room) throw new Error(`Room ${id} not found`)
    const updated = updater(room)
    const redis = getRedisClient()
    await redis.set(`game:room:${id}`, serialise(updated), {
      ex: ROOM_TTL,
    })
    return updated
  },

  async delete(id: string): Promise<void> {
    const redis = getRedisClient()
    await redis.del(`game:room:${id}`)
    await redis.decr('game:room:count')
  },

  async getConcurrentCount(): Promise<number> {
    const redis = getRedisClient()
    return (await redis.get<number>('game:room:count')) ?? 0
  },
}

export { serialise as _serialise, deserialise as _deserialise }
