import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveResult, getResult, incrementStats } from '@/lib/result-store'
import type { EvaluationResult } from '@/lib/types'

const mockSet = vi.fn()
const mockGet = vi.fn()
const mockIncr = vi.fn()

vi.mock('@/lib/upstash', () => ({
  getRedisClient: () => ({
    set: mockSet,
    get: mockGet,
    incr: mockIncr,
  }),
}))

const mockResult: EvaluationResult = {
  id: 'test123abc12',
  situation: 'My manager schedules 2-hour standups',
  chaosRating: 7,
  chaosLabel: 'Contemplating BSOD as self-care',
  survivalDuration: '3 days, 6 hours',
  timeline: [
    { time: 'Day 1, 9:00 AM', event: 'Arrived optimistic', sanityLevel: '95%' },
    {
      time: 'Day 1, 10:30 AM',
      event: 'First standup started',
      sanityLevel: '60%',
    },
  ],
  breakingPoint: 'The pre-standup alignment sync',
  resignationLetter: 'Dear Management, I quit.',
  oneLineSummary: 'AI lasted 3 days before the standups broke it.',
  realTalkInsight:
    'Try async standups via Slack — most updates are read, not discussed.',
  createdAt: Date.now(),
  upvotes: 0,
}

describe('saveResult', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves to Redis with correct key and TTL', async () => {
    mockSet.mockResolvedValue('OK')
    await saveResult(mockResult)

    expect(mockSet).toHaveBeenCalledWith(
      'fsh:wais:result:test123abc12',
      JSON.stringify(mockResult),
      { ex: 60 * 60 * 24 * 30 }
    )
  })
})

describe('getResult', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns parsed result when found', async () => {
    mockGet.mockResolvedValue(JSON.stringify(mockResult))
    const result = await getResult('test123abc12')
    expect(result).toEqual(mockResult)
  })

  it('returns null when not found', async () => {
    mockGet.mockResolvedValue(null)
    const result = await getResult('nonexistent')
    expect(result).toBeNull()
  })

  it('handles already-parsed objects from Redis', async () => {
    // Upstash sometimes returns parsed objects directly
    mockGet.mockResolvedValue(mockResult)
    const result = await getResult('test123abc12')
    expect(result).toEqual(mockResult)
  })
})

describe('incrementStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('increments the stats counter', async () => {
    mockIncr.mockResolvedValue(42)
    await incrementStats()
    expect(mockIncr).toHaveBeenCalledWith('fsh:wais:stats:total')
  })
})
