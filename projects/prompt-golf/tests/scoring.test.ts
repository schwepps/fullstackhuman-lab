import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  getScoreLabel,
  getCelebrationMessage,
  getScoreCssClass,
} from '@/lib/scoring'

describe('calculateScore', () => {
  it('calculates basic score with no penalty on first attempt', () => {
    const score = calculateScore(5, 6, 1, true)
    expect(score.wordCount).toBe(5)
    expect(score.par).toBe(6)
    expect(score.attemptNumber).toBe(1)
    expect(score.attemptPenalty).toBe(1)
    expect(score.effectiveStrokes).toBe(5)
    expect(score.relativeScore).toBe(-1)
    expect(score.label).toBe('Birdie')
    expect(score.isPassing).toBe(true)
  })

  it('applies 25% penalty on second attempt', () => {
    const score = calculateScore(5, 6, 2, true)
    expect(score.attemptPenalty).toBe(1.25)
    // ceil(5 * 1.25) = ceil(6.25) = 7
    expect(score.effectiveStrokes).toBe(7)
    expect(score.relativeScore).toBe(1)
    expect(score.label).toBe('Bogey')
  })

  it('applies 50% penalty on third attempt', () => {
    const score = calculateScore(4, 6, 3, true)
    expect(score.attemptPenalty).toBe(1.5)
    // ceil(4 * 1.5) = ceil(6) = 6
    expect(score.effectiveStrokes).toBe(6)
    expect(score.relativeScore).toBe(0)
    expect(score.label).toBe('Par')
  })

  it('rounds up with ceil', () => {
    const score = calculateScore(3, 5, 2, true)
    // ceil(3 * 1.25) = ceil(3.75) = 4
    expect(score.effectiveStrokes).toBe(4)
  })

  it('returns N/A label for failing attempts', () => {
    const score = calculateScore(5, 6, 1, false)
    expect(score.label).toBe('N/A')
    expect(score.isPassing).toBe(false)
  })

  it('handles exact par', () => {
    const score = calculateScore(6, 6, 1, true)
    expect(score.relativeScore).toBe(0)
    expect(score.label).toBe('Par')
  })

  it('handles albatross (3 under par)', () => {
    const score = calculateScore(3, 6, 1, true)
    expect(score.relativeScore).toBe(-3)
    expect(score.label).toBe('Albatross')
  })

  it('handles extreme over-par', () => {
    const score = calculateScore(15, 6, 1, true)
    expect(score.relativeScore).toBe(9)
    expect(score.label).toBe('+9')
  })

  it('throws on negative wordCount', () => {
    expect(() => calculateScore(-1, 6, 1, true)).toThrow('wordCount')
  })

  it('throws on zero par', () => {
    expect(() => calculateScore(5, 0, 1, true)).toThrow('par')
  })

  it('throws on zero attemptNumber', () => {
    expect(() => calculateScore(5, 6, 0, true)).toThrow('attemptNumber')
  })

  it('throws on negative attemptNumber', () => {
    expect(() => calculateScore(5, 6, -1, true)).toThrow('attemptNumber')
  })

  it('handles high attempt penalty without floating-point drift', () => {
    // attempt 5: penalty = 1 + 4 * 0.25 = 2.0
    const score = calculateScore(5, 6, 5, true)
    expect(score.effectiveStrokes).toBe(10) // exactly 5 * 2.0
  })
})

describe('getScoreLabel', () => {
  it('returns correct labels for standard scores', () => {
    expect(getScoreLabel(-4)).toBe('Albatross')
    expect(getScoreLabel(-3)).toBe('Albatross')
    expect(getScoreLabel(-2)).toBe('Eagle')
    expect(getScoreLabel(-1)).toBe('Birdie')
    expect(getScoreLabel(0)).toBe('Par')
    expect(getScoreLabel(1)).toBe('Bogey')
    expect(getScoreLabel(2)).toBe('Double Bogey')
    expect(getScoreLabel(3)).toBe('Triple Bogey')
    expect(getScoreLabel(4)).toBe('+4')
  })
})

describe('getScoreCssClass', () => {
  it('returns correct CSS classes', () => {
    expect(getScoreCssClass('Eagle')).toBe('score-eagle')
    expect(getScoreCssClass('Birdie')).toBe('score-birdie')
    expect(getScoreCssClass('Par')).toBe('score-par')
    expect(getScoreCssClass('Bogey')).toBe('score-bogey')
    expect(getScoreCssClass('+5')).toBe('score-double-bogey')
  })
})

describe('getCelebrationMessage', () => {
  it('returns appropriate messages', () => {
    expect(getCelebrationMessage('Albatross')).toContain('tipped its hat')
    expect(getCelebrationMessage('Eagle')).toContain('clubhouse')
    expect(getCelebrationMessage('Birdie')).toContain('caddie approves')
    expect(getCelebrationMessage('Par')).toContain('martini')
    expect(getCelebrationMessage('Bogey')).toContain('passed')
    expect(getCelebrationMessage('+5')).toContain('passed')
  })
})
