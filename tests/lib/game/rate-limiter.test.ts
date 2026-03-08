import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkRoomCreationAllowed,
  checkMessageRateAllowed,
  checkAgentCooldown,
} from '@/lib/game/rate-limiter'

const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  exists: vi.fn(),
  set: vi.fn(),
}

vi.mock('@/lib/upstash', () => ({
  getRedisClient: () => mockRedis,
}))

const mockGetConcurrentCount = vi.fn()

vi.mock('@/lib/game/room-store', () => ({
  roomStore: {
    getConcurrentCount: (...args: unknown[]) => mockGetConcurrentCount(...args),
  },
}))

describe('checkRoomCreationAllowed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows room creation when under limits', async () => {
    mockGetConcurrentCount.mockResolvedValue(5)
    mockRedis.incr.mockResolvedValue(1)

    const result = await checkRoomCreationAllowed('127.0.0.1')

    expect(result).toEqual({ allowed: true })
    expect(mockRedis.expire).toHaveBeenCalledWith(
      'game:ratelimit:create:127.0.0.1',
      3600
    )
  })

  it('rejects when global room cap reached', async () => {
    mockGetConcurrentCount.mockResolvedValue(20)

    const result = await checkRoomCreationAllowed('127.0.0.1')

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('capacity')
  })

  it('rejects 4th room from same IP within an hour', async () => {
    mockGetConcurrentCount.mockResolvedValue(5)
    mockRedis.incr.mockResolvedValue(4)

    const result = await checkRoomCreationAllowed('127.0.0.1')

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Too many rooms')
  })

  it('allows 3rd room from same IP', async () => {
    mockGetConcurrentCount.mockResolvedValue(5)
    mockRedis.incr.mockResolvedValue(3)

    const result = await checkRoomCreationAllowed('127.0.0.1')

    expect(result).toEqual({ allowed: true })
  })
})

describe('checkMessageRateAllowed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows messages under the limit', async () => {
    mockRedis.incr.mockResolvedValue(1)

    const result = await checkMessageRateAllowed('player-1')

    expect(result).toBe(true)
    expect(mockRedis.expire).toHaveBeenCalledWith(
      'game:ratelimit:msg:player-1',
      60
    )
  })

  it('allows exactly 8 messages per minute', async () => {
    mockRedis.incr.mockResolvedValue(8)

    const result = await checkMessageRateAllowed('player-1')

    expect(result).toBe(true)
  })

  it('rejects 9th message in a minute', async () => {
    mockRedis.incr.mockResolvedValue(9)

    const result = await checkMessageRateAllowed('player-1')

    expect(result).toBe(false)
  })
})

describe('checkAgentCooldown', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows when no cooldown active', async () => {
    mockRedis.exists.mockResolvedValue(0)

    const result = await checkAgentCooldown('room-1', 'main')

    expect(result).toBe(true)
    expect(mockRedis.set).toHaveBeenCalledWith(
      'game:agentcooldown:room-1:main',
      '1',
      { px: 4000 }
    )
  })

  it('rejects when cooldown is active', async () => {
    mockRedis.exists.mockResolvedValue(1)

    const result = await checkAgentCooldown('room-1', 'main')

    expect(result).toBe(false)
    expect(mockRedis.set).not.toHaveBeenCalled()
  })

  it('uses zone-specific cooldown keys', async () => {
    mockRedis.exists.mockResolvedValue(0)

    await checkAgentCooldown('room-1', 'private-a')

    expect(mockRedis.exists).toHaveBeenCalledWith(
      'game:agentcooldown:room-1:private-a'
    )
  })
})
