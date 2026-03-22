import 'server-only'
import { getRedisClient } from './upstash'
import {
  REDIS_KEYS,
  ROOM_TTL_SECONDS,
  ROOM_CODE_LENGTH,
  ROUND_TIMEOUT_MS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  TOTAL_ROUNDS,
  AI_SKILLS,
} from './constants'
import type {
  Room,
  RoomStatus,
  Player,
  RoundMessage,
  RoundVotes,
  GuiltScore,
  FinalVerdict,
} from './types'

// ── Room Code ────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O/0/1/I

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

// ── Room CRUD ────────────────────────────────────────────────────

export async function createRoom(
  creatorName: string,
  creatorSessionId: string,
  crime: string,
  initialAccusation: string
): Promise<Room> {
  const redis = getRedisClient()
  const code = generateRoomCode()
  const skillIndex = Math.floor(Math.random() * AI_SKILLS.length)

  const room: Room = {
    code,
    creatorName,
    creatorSessionId,
    crime,
    initialAccusation,
    status: 'lobby',
    currentRound: 0,
    initialAccusedIndex: null,
    skillId: AI_SKILLS[skillIndex].id,
    roundDeadline: null,
    createdAt: new Date().toISOString(),
  }

  await redis.hset(REDIS_KEYS.room(code), roomToHash(room))
  await redis.expire(REDIS_KEYS.room(code), ROOM_TTL_SECONDS)

  // Add creator as first player
  const creator: Player = {
    name: creatorName,
    sessionId: creatorSessionId,
    joinedAt: room.createdAt,
  }
  await redis.rpush(REDIS_KEYS.roomPlayers(code), JSON.stringify(creator))
  await redis.expire(REDIS_KEYS.roomPlayers(code), ROOM_TTL_SECONDS)

  return room
}

export async function getRoom(code: string): Promise<Room | null> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.room(code))
  if (!raw || Object.keys(raw).length === 0) return null
  return parseRoom(raw)
}

export async function getPlayers(code: string): Promise<Player[]> {
  const redis = getRedisClient()
  const raw = await redis.lrange(REDIS_KEYS.roomPlayers(code), 0, -1)
  return (raw as string[]).map((item) =>
    typeof item === 'string' ? (JSON.parse(item) as Player) : (item as Player)
  )
}

export async function joinRoom(
  code: string,
  name: string,
  sessionId: string
): Promise<Player> {
  const redis = getRedisClient()
  const room = await getRoom(code)
  if (!room) throw new Error('Room not found')
  if (room.status !== 'lobby') throw new Error('Game already started')

  const players = await getPlayers(code)
  if (players.length >= MAX_PLAYERS) throw new Error('Room is full')

  // Check if session already joined
  const existing = players.find((p) => p.sessionId === sessionId)
  if (existing) return existing

  const player: Player = {
    name,
    sessionId,
    joinedAt: new Date().toISOString(),
  }

  await redis.rpush(REDIS_KEYS.roomPlayers(code), JSON.stringify(player))
  return player
}

// ── Game Lifecycle ───────────────────────────────────────────────

export async function startGame(
  code: string,
  sessionId: string
): Promise<Room> {
  const redis = getRedisClient()
  const room = await getRoom(code)
  if (!room) throw new Error('Room not found')
  if (room.creatorSessionId !== sessionId)
    throw new Error('Only the creator can start')
  if (room.status !== 'lobby') throw new Error('Game already started')

  const players = await getPlayers(code)
  if (players.length < MIN_PLAYERS)
    throw new Error(`Need at least ${MIN_PLAYERS} players`)

  // Random accused (including creator)
  const accusedIndex = Math.floor(Math.random() * players.length)

  room.status = 'playing'
  room.currentRound = 1
  room.initialAccusedIndex = accusedIndex
  room.roundDeadline = new Date(Date.now() + ROUND_TIMEOUT_MS).toISOString()

  await redis.hset(REDIS_KEYS.room(code), roomToHash(room))
  return room
}

export async function advanceRound(code: string): Promise<Room> {
  const redis = getRedisClient()
  const room = await getRoom(code)
  if (!room) throw new Error('Room not found')

  if (room.currentRound >= TOTAL_ROUNDS) {
    room.status = 'finished'
    room.roundDeadline = null
  } else {
    room.currentRound += 1
    room.roundDeadline = new Date(Date.now() + ROUND_TIMEOUT_MS).toISOString()
  }

  await redis.hset(REDIS_KEYS.room(code), roomToHash(room))
  return room
}

// ── Round Messages ───────────────────────────────────────────────

export async function storeMessage(
  code: string,
  round: number,
  message: RoundMessage
): Promise<void> {
  const redis = getRedisClient()
  await redis.hset(REDIS_KEYS.roundMessages(code, round), {
    [message.sessionId]: JSON.stringify(message),
  })
  await redis.expire(REDIS_KEYS.roundMessages(code, round), ROOM_TTL_SECONDS)
}

export async function getRoundMessages(
  code: string,
  round: number
): Promise<RoundMessage[]> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.roundMessages(code, round))
  if (!raw) return []
  return Object.values(raw).map((v) =>
    typeof v === 'string'
      ? (JSON.parse(v) as RoundMessage)
      : (v as RoundMessage)
  )
}

// ── Voting ───────────────────────────────────────────────────────

export async function storeVote(
  code: string,
  round: number,
  voterSessionId: string,
  votedForSessionId: string
): Promise<void> {
  const redis = getRedisClient()
  await redis.hset(REDIS_KEYS.roundVotes(code, round), {
    [voterSessionId]: votedForSessionId,
  })
  await redis.expire(REDIS_KEYS.roundVotes(code, round), ROOM_TTL_SECONDS)
}

export async function getRoundVotes(
  code: string,
  round: number
): Promise<RoundVotes> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.roundVotes(code, round))
  if (!raw) return {}
  const votes: RoundVotes = {}
  for (const [key, val] of Object.entries(raw)) {
    votes[key] = val as string
  }
  return votes
}

// ── Scores ───────────────────────────────────────────────────────

export async function storeScores(
  code: string,
  scores: GuiltScore[]
): Promise<void> {
  const redis = getRedisClient()
  const hash: Record<string, string> = {}
  for (const score of scores) {
    hash[score.sessionId] = JSON.stringify(score)
  }
  await redis.hset(REDIS_KEYS.roomScores(code), hash)
  await redis.expire(REDIS_KEYS.roomScores(code), ROOM_TTL_SECONDS)
}

export async function getScores(code: string): Promise<GuiltScore[]> {
  const redis = getRedisClient()
  const raw = await redis.hgetall(REDIS_KEYS.roomScores(code))
  if (!raw) return []
  return Object.values(raw).map((v) =>
    typeof v === 'string' ? (JSON.parse(v) as GuiltScore) : (v as GuiltScore)
  )
}

// ── Verdict ──────────────────────────────────────────────────────

export async function storeVerdict(
  code: string,
  verdict: FinalVerdict
): Promise<void> {
  const redis = getRedisClient()
  await redis.set(REDIS_KEYS.roomVerdict(code), JSON.stringify(verdict))
  await redis.expire(REDIS_KEYS.roomVerdict(code), ROOM_TTL_SECONDS)
}

export async function getVerdict(code: string): Promise<FinalVerdict | null> {
  const redis = getRedisClient()
  const raw = await redis.get(REDIS_KEYS.roomVerdict(code))
  if (!raw) return null
  return typeof raw === 'string'
    ? (JSON.parse(raw) as FinalVerdict)
    : (raw as FinalVerdict)
}

// ── AI Tip ───────────────────────────────────────────────────────

export async function storeTip(code: string, tip: string): Promise<void> {
  const redis = getRedisClient()
  await redis.set(REDIS_KEYS.roomTip(code), tip)
  await redis.expire(REDIS_KEYS.roomTip(code), ROOM_TTL_SECONDS)
}

export async function getTip(code: string): Promise<string | null> {
  const redis = getRedisClient()
  const raw = await redis.get(REDIS_KEYS.roomTip(code))
  return raw as string | null
}

// ── Helpers ──────────────────────────────────────────────────────

function roomToHash(room: Room): Record<string, string> {
  return {
    code: room.code,
    creatorName: room.creatorName,
    creatorSessionId: room.creatorSessionId,
    crime: room.crime,
    initialAccusation: room.initialAccusation,
    status: room.status,
    currentRound: String(room.currentRound),
    initialAccusedIndex:
      room.initialAccusedIndex !== null ? String(room.initialAccusedIndex) : '',
    skillId: room.skillId,
    roundDeadline: room.roundDeadline ?? '',
    createdAt: room.createdAt,
  }
}

function parseRoom(raw: Record<string, unknown>): Room {
  return {
    code: raw.code as string,
    creatorName: raw.creatorName as string,
    creatorSessionId: raw.creatorSessionId as string,
    crime: raw.crime as string,
    initialAccusation: raw.initialAccusation as string,
    status: raw.status as RoomStatus,
    currentRound: Number(raw.currentRound),
    initialAccusedIndex:
      (raw.initialAccusedIndex as string) !== ''
        ? Number(raw.initialAccusedIndex)
        : null,
    skillId: raw.skillId as string,
    roundDeadline: (raw.roundDeadline as string) || null,
    createdAt: raw.createdAt as string,
  }
}
