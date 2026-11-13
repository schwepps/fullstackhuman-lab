import { describe, it, expect } from 'vitest'
import {
  assignPeriods,
  parseSanity,
  periodLabel,
  sanityTone,
} from '@/lib/calendar'

const entry = (period?: number) => ({
  time: 't',
  event: 'e',
  sanityLevel: '50%',
  period,
})

describe('assignPeriods', () => {
  it('uses the model periods, capped at seven columns', () => {
    expect(assignPeriods([entry(1), entry(3), entry(9)])).toEqual([1, 3, 7])
  })

  it('keeps an entry missing its period in the previous column', () => {
    expect(assignPeriods([entry(1), entry(2), entry(), entry(4)])).toEqual([
      1, 2, 2, 4,
    ])
  })

  it('spreads old results without periods over at most four columns', () => {
    const periods = assignPeriods([1, 2, 3, 4, 5, 6, 7, 8].map(() => entry()))
    expect(periods).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
  })

  it('gives each entry its own column when there are few', () => {
    expect(assignPeriods([entry(), entry()])).toEqual([1, 2])
  })
})

describe('periodLabel', () => {
  it('names weekdays for day views and numbers the rest', () => {
    expect(periodLabel('day', 1)).toBe('Monday')
    expect(periodLabel('day', 6)).toBe('Day 6')
    expect(periodLabel('week', 2)).toBe('Week 2')
    expect(periodLabel(undefined, 3)).toBe('Stage 3')
  })
})

describe('sanity helpers', () => {
  it('reads negative and positive levels', () => {
    expect(parseSanity('-41%')).toBe(-41)
    expect(parseSanity('73%')).toBe(73)
    expect(parseSanity('gone')).toBeNull()
  })

  it('maps sanity to tones', () => {
    expect(sanityTone(80)).toBe('ok')
    expect(sanityTone(50)).toBe('warn')
    expect(sanityTone(-10)).toBe('bad')
  })
})
