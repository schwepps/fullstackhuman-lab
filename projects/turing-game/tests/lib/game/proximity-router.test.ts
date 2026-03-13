import { describe, it, expect } from 'vitest'
import { computeZone, getPlayersInZone } from '@/partykit/src/proximity-router'
import type { ZoneType } from '@/lib/game/types'

describe('computeZone', () => {
  it('returns main for center of canvas', () => {
    expect(computeZone({ x: 600, y: 400 })).toBe('main')
  })

  it('returns private-a for Corner Booth area', () => {
    expect(computeZone({ x: 50, y: 50 })).toBe('private-a')
  })

  it('returns private-a at exact bounds', () => {
    expect(computeZone({ x: 20, y: 20 })).toBe('private-a')
    expect(computeZone({ x: 180, y: 140 })).toBe('private-a')
  })

  it('returns private-b for Back Room area', () => {
    expect(computeZone({ x: 1100, y: 80 })).toBe('private-b')
  })

  it('returns private-c for Side Hall area', () => {
    expect(computeZone({ x: 100, y: 700 })).toBe('private-c')
  })

  it('returns main when just outside a private zone', () => {
    // Just outside Corner Booth (x=181 is past x+width=180)
    expect(computeZone({ x: 181, y: 50 })).toBe('main')
  })

  it('returns main for positions outside all zones', () => {
    expect(computeZone({ x: 500, y: 500 })).toBe('main')
  })
})

describe('getPlayersInZone', () => {
  it('returns players in the specified zone', () => {
    const zones = new Map<string, ZoneType>([
      ['p1', 'main'],
      ['p2', 'private-a'],
      ['p3', 'private-a'],
      ['p4', 'private-b'],
    ])

    expect(getPlayersInZone('private-a', zones)).toEqual(['p2', 'p3'])
    expect(getPlayersInZone('main', zones)).toEqual(['p1'])
    expect(getPlayersInZone('private-b', zones)).toEqual(['p4'])
  })

  it('returns empty array for zone with no players', () => {
    const zones = new Map<string, ZoneType>([['p1', 'main']])
    expect(getPlayersInZone('private-c', zones)).toEqual([])
  })

  it('returns empty array for empty zones map', () => {
    expect(getPlayersInZone('main', new Map())).toEqual([])
  })
})
