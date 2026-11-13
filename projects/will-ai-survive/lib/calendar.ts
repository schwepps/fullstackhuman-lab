import type { CalendarUnit, TimelineEntry } from './types'

export const MAX_PERIODS = 7
const FALLBACK_COLUMNS = 4
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const SANITY_FLOOR = -50
const SANITY_OK = 70
const SANITY_WARN = 35

export type SanityTone = 'ok' | 'warn' | 'bad'

/** 1-based column per entry. Results saved before calendar fields get evenly spread columns. */
export function assignPeriods(entries: TimelineEntry[]): number[] {
  if (entries.every((entry) => entry.period != null)) {
    return entries.map((entry) => Math.min(entry.period ?? 1, MAX_PERIODS))
  }
  const columns = Math.min(entries.length, FALLBACK_COLUMNS)
  return entries.map((_, i) => Math.floor((i * columns) / entries.length) + 1)
}

export function periodLabel(unit: CalendarUnit | undefined, n: number): string {
  if (!unit) return `Stage ${n}`
  if (unit === 'day' && n <= WEEKDAYS.length) return WEEKDAYS[n - 1]
  return `${unit.charAt(0).toUpperCase()}${unit.slice(1)} ${n}`
}

export function parseSanity(level: string): number | null {
  const match = level.match(/-?\d+/)
  return match ? Number(match[0]) : null
}

export function sanityTone(sanity: number): SanityTone {
  if (sanity >= SANITY_OK) return 'ok'
  if (sanity >= SANITY_WARN) return 'warn'
  return 'bad'
}

/** Events lean further as sanity drops, alternating direction. */
export function tiltDegrees(sanity: number, index: number): number {
  const MAX_TILT = 5
  const stress = Math.max(0, 100 - sanity) / 100
  return (index % 2 ? 1 : -1) * stress * MAX_TILT
}
