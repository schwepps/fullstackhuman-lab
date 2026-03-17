import { describe, it, expect } from 'vitest'
import { calculateScore, MAX_POSSIBLE_SCORE } from '../lib/scoring'

describe('calculateScore', () => {
  it('calculates first-try bonus correctly', () => {
    // Level 1, 1 attempt: 100 + (10-1)*10 + 50 = 100 + 90 + 50 = 240
    expect(calculateScore(1, 1)).toBe(240)
  })

  it('calculates efficiency bonus correctly', () => {
    // Level 3, 5 attempts: 300 + (10-5)*10 + 0 = 300 + 50 = 350
    expect(calculateScore(3, 5)).toBe(350)
  })

  it('gives no efficiency bonus after 10 attempts', () => {
    // Level 2, 15 attempts: 200 + 0 + 0 = 200
    expect(calculateScore(2, 15)).toBe(200)
  })

  it('gives no efficiency bonus at exactly 10 attempts', () => {
    // Level 1, 10 attempts: 100 + 0 + 0 = 100
    expect(calculateScore(1, 10)).toBe(100)
  })

  it('scales base score with level', () => {
    // Level 7, 1 attempt: 700 + 90 + 50 = 840
    expect(calculateScore(7, 1)).toBe(840)
  })

  it('MAX_POSSIBLE_SCORE is sum of all first-try scores', () => {
    const expected = [1, 2, 3, 4, 5, 6, 7].reduce(
      (sum, level) => sum + calculateScore(level, 1),
      0
    )
    expect(MAX_POSSIBLE_SCORE).toBe(expected)
  })
})
