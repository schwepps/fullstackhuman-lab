import { describe, it, expect } from 'vitest'
import { rankScore } from '@/lib/leaderboard-client'

// The sorted set is read lowest score first.
describe('rankScore', () => {
  it('ranks a full course above a single hole with fewer strokes', () => {
    expect(rankScore(40, 9)).toBeLessThan(rankScore(3, 1))
  })

  it('ranks fewer strokes first when the hole count is equal', () => {
    expect(rankScore(30, 9)).toBeLessThan(rankScore(40, 9))
  })
})
