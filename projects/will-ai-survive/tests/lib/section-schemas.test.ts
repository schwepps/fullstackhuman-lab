import { describe, it, expect } from 'vitest'
import { parseSection } from '@/lib/section-schemas'

describe('parseSection', () => {
  it('parses a valid chaos rating', () => {
    const result = parseSection('chaos_rating', {
      chaosRating: 8,
      chaosLabel: 'The org chart is breathing',
      survivalDuration: '4 days',
    })

    expect(result).toEqual({
      name: 'chaos_rating',
      data: {
        chaosRating: 8,
        chaosLabel: 'The org chart is breathing',
        survivalDuration: '4 days',
      },
    })
  })

  it('clamps an out-of-range chaos rating to 1-10', () => {
    const result = parseSection('chaos_rating', {
      chaosRating: 42,
      chaosLabel: 'x',
      survivalDuration: 'y',
    })

    expect(result?.name === 'chaos_rating' && result.data.chaosRating).toBe(10)
  })

  it('defaults a non-numeric chaos rating to 5', () => {
    const result = parseSection('chaos_rating', {
      chaosRating: 'very',
      chaosLabel: 'x',
      survivalDuration: 'y',
    })

    expect(result?.name === 'chaos_rating' && result.data.chaosRating).toBe(5)
  })

  it('rejects a chaos rating without a label', () => {
    expect(
      parseSection('chaos_rating', { chaosRating: 3, survivalDuration: 'y' })
    ).toBeNull()
  })

  it('accepts a numeric sanity level and stores it as a string', () => {
    const result = parseSection('timeline_entry', {
      time: 'Day 1',
      event: 'Standup ran 3 hours.',
      sanityLevel: 85,
    })

    expect(result?.name === 'timeline_entry' && result.data.sanityLevel).toBe(
      '85'
    )
  })

  it('rejects a timeline entry with an empty event', () => {
    expect(
      parseSection('timeline_entry', {
        time: 'Day 1',
        event: '  ',
        sanityLevel: '80%',
      })
    ).toBeNull()
  })

  it('rejects a resignation without a letter', () => {
    expect(parseSection('resignation', { oneLineSummary: 'bye' })).toBeNull()
  })

  it('returns null for an unknown section name', () => {
    expect(parseSection('epilogue', { text: 'x' })).toBeNull()
  })
})

describe('parseSection optional fields', () => {
  it('drops an empty thought instead of keeping an empty string', () => {
    const result = parseSection('timeline_entry', {
      time: 'Day 1',
      event: 'Standup ran 3 hours.',
      sanityLevel: '80%',
      thought: '   ',
    })

    expect(result?.name === 'timeline_entry' && result.data.thought).toBe(
      undefined
    )
  })
})

describe('parseSection null tolerance', () => {
  const base = { chaosLabel: 'a', survivalDuration: 'b' }

  it('keeps a chaos rating whose empathyNote is null', () => {
    const result = parseSection('chaos_rating', {
      ...base,
      chaosRating: 3,
      empathyNote: null,
    })

    expect(result?.name).toBe('chaos_rating')
  })

  it('keeps a timeline entry whose thought is null', () => {
    const result = parseSection('timeline_entry', {
      time: 'Day 1',
      event: 'E',
      sanityLevel: '1%',
      thought: null,
    })

    expect(result?.name).toBe('timeline_entry')
  })

  it.each([null, ''])('defaults a %j chaos rating to 5', (value) => {
    const result = parseSection('chaos_rating', { ...base, chaosRating: value })

    expect(result?.name === 'chaos_rating' && result.data.chaosRating).toBe(5)
  })

  it('treats a numeric 0 as a real value and clamps it to 1', () => {
    const result = parseSection('chaos_rating', { ...base, chaosRating: 0 })

    expect(result?.name === 'chaos_rating' && result.data.chaosRating).toBe(1)
  })

  it('parses calendar fields and drops invalid ones instead of failing', () => {
    const rating = parseSection('chaos_rating', {
      chaosRating: 5,
      chaosLabel: 'L',
      survivalDuration: '2 days',
      calendarUnit: 'fortnight',
    })
    expect(rating?.name === 'chaos_rating' && rating.data.calendarUnit).toBe(
      undefined
    )
    const entry = parseSection('timeline_entry', {
      time: 'Day 2',
      period: '2',
      event: 'E',
      sanityLevel: '50%',
    })
    expect(entry?.name === 'timeline_entry' && entry.data.period).toBe(2)
  })
})
