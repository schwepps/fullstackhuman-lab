import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Room, Player } from '@/lib/game/types'
import { _serialise, _deserialise } from '@/lib/game/room-store'

// Mock Redis client
const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  incr: vi.fn(),
  decr: vi.fn(),
}

vi.mock('@/lib/upstash', () => ({
  getRedisClient: () => mockRedis,
}))

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    displayName: 'TestPlayer',
    type: 'human',
    model: 'claude-sonnet-4-6',
    revealPreference: 'public',
    position: { x: 100, y: 200 },
    currentZone: 'main',
    avatarColor: 0x22d3ee,
    isConnected: true,
    isEliminated: false,
    score: 0,
    roundsSurvived: 0,
    correctVotes: 0,
    sessionToken: 'token-abc',
    chatHistory: [],
    ...overrides,
  }
}

function createTestRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'test-room-1',
    hostId: 'player-1',
    phase: 'lobby',
    round: 0,
    maxRounds: 4,
    roundDuration: 180,
    players: new Map([['player-1', createTestPlayer()]]),
    votes: new Map(),
    roundResults: [],
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('room-store serialisation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('round-trips a room without data loss', () => {
    const room = createTestRoom()
    const serialised = _serialise(room)
    const deserialised = _deserialise(serialised)

    expect(deserialised.id).toBe(room.id)
    expect(deserialised.hostId).toBe(room.hostId)
    expect(deserialised.phase).toBe(room.phase)
    expect(deserialised.round).toBe(room.round)
    expect(deserialised.maxRounds).toBe(room.maxRounds)
    expect(deserialised.roundDuration).toBe(room.roundDuration)
  })

  it('preserves Map<string, Player> through round-trip', () => {
    const player1 = createTestPlayer({ id: 'p1', displayName: 'Alice' })
    const player2 = createTestPlayer({
      id: 'p2',
      displayName: 'Bob',
      type: 'auto-agent',
    })
    const room = createTestRoom({
      players: new Map([
        ['p1', player1],
        ['p2', player2],
      ]),
    })

    const deserialised = _deserialise(_serialise(room))

    expect(deserialised.players).toBeInstanceOf(Map)
    expect(deserialised.players.size).toBe(2)
    expect(deserialised.players.get('p1')?.displayName).toBe('Alice')
    expect(deserialised.players.get('p2')?.type).toBe('auto-agent')
  })

  it('preserves Map<string, string> votes through round-trip', () => {
    const room = createTestRoom({
      votes: new Map([
        ['p1', 'p2'],
        ['p3', 'p1'],
      ]),
    })

    const deserialised = _deserialise(_serialise(room))

    expect(deserialised.votes).toBeInstanceOf(Map)
    expect(deserialised.votes.size).toBe(2)
    expect(deserialised.votes.get('p1')).toBe('p2')
    expect(deserialised.votes.get('p3')).toBe('p1')
  })

  it('trims chat history to MAX_CHAT_HISTORY_PER_ZONE', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      id: `msg-${i}`,
      playerId: 'p1',
      displayName: 'Alice',
      content: `Message ${i}`,
      zone: 'main' as const,
      timestamp: Date.now() + i,
    }))

    const player = createTestPlayer({
      chatHistory: [{ zone: 'main', messages }],
    })
    const room = createTestRoom({
      players: new Map([['p1', player]]),
    })

    const deserialised = _deserialise(_serialise(room))
    const history = deserialised.players.get('p1')?.chatHistory[0]

    expect(history?.messages.length).toBe(50)
    expect(history?.messages[0].content).toBe('Message 50')
    expect(history?.messages[49].content).toBe('Message 99')
  })

  it('preserves GameResult with scores Map through round-trip', () => {
    const room = createTestRoom({
      results: {
        wasAllHumans: false,
        wasAllAgents: false,
        agentsSurvived: ['p2'],
        agentsCaught: [],
        humansEliminated: ['p1'],
        scores: new Map([
          ['p1', 30],
          ['p2', 80],
        ]),
        promptReveal: [],
      },
    })

    const deserialised = _deserialise(_serialise(room))

    expect(deserialised.results?.scores).toBeInstanceOf(Map)
    expect(deserialised.results?.scores.get('p1')).toBe(30)
    expect(deserialised.results?.scores.get('p2')).toBe(80)
    expect(deserialised.results?.wasAllHumans).toBe(false)
    expect(deserialised.results?.agentsSurvived).toEqual(['p2'])
  })

  it('handles room with no results (undefined)', () => {
    const room = createTestRoom()
    const deserialised = _deserialise(_serialise(room))
    expect(deserialised.results).toBeUndefined()
  })

  it('preserves player position and zone data', () => {
    const player = createTestPlayer({
      position: { x: 500, y: 300 },
      currentZone: 'private-a',
    })
    const room = createTestRoom({
      players: new Map([['p1', player]]),
    })

    const deserialised = _deserialise(_serialise(room))
    const p = deserialised.players.get('p1')

    expect(p?.position).toEqual({ x: 500, y: 300 })
    expect(p?.currentZone).toBe('private-a')
  })
})

describe('roomStore CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create stores room with TTL and increments count', async () => {
    const { roomStore } = await import('@/lib/game/room-store')
    const room = createTestRoom()

    await roomStore.create(room)

    expect(mockRedis.set).toHaveBeenCalledWith(
      'game:room:test-room-1',
      expect.any(String),
      { ex: 7200 }
    )
    expect(mockRedis.incr).toHaveBeenCalledWith('game:room:count')
  })

  it('get returns null for missing room', async () => {
    const { roomStore } = await import('@/lib/game/room-store')
    mockRedis.get.mockResolvedValue(null)

    const result = await roomStore.get('nonexistent')

    expect(result).toBeNull()
  })

  it('get deserialises stored room', async () => {
    const { roomStore } = await import('@/lib/game/room-store')
    const room = createTestRoom()
    mockRedis.get.mockResolvedValue(_serialise(room))

    const result = await roomStore.get('test-room-1')

    expect(result?.id).toBe('test-room-1')
    expect(result?.players).toBeInstanceOf(Map)
  })

  it('delete removes room and decrements count', async () => {
    const { roomStore } = await import('@/lib/game/room-store')

    await roomStore.delete('test-room-1')

    expect(mockRedis.del).toHaveBeenCalledWith('game:room:test-room-1')
    expect(mockRedis.decr).toHaveBeenCalledWith('game:room:count')
  })

  it('getConcurrentCount returns 0 when no count exists', async () => {
    const { roomStore } = await import('@/lib/game/room-store')
    mockRedis.get.mockResolvedValue(null)

    const count = await roomStore.getConcurrentCount()

    expect(count).toBe(0)
  })

  it('update throws when room not found', async () => {
    const { roomStore } = await import('@/lib/game/room-store')
    mockRedis.get.mockResolvedValue(null)

    await expect(roomStore.update('nonexistent', (r) => r)).rejects.toThrow(
      'Room nonexistent not found'
    )
  })
})
