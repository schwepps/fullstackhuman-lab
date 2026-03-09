import type { Zone } from './types'

export const ZONES: Zone[] = [
  {
    id: 'main',
    label: 'Main Room',
    bounds: { x: 200, y: 150, width: 800, height: 500 },
    capacity: 99,
    isPrivate: false,
  },
  {
    id: 'private-a',
    label: 'Corner Booth',
    bounds: { x: 20, y: 20, width: 160, height: 120 },
    capacity: 3,
    isPrivate: true,
  },
  {
    id: 'private-b',
    label: 'Back Room',
    bounds: { x: 1020, y: 20, width: 160, height: 120 },
    capacity: 3,
    isPrivate: true,
  },
  {
    id: 'private-c',
    label: 'Side Hall',
    bounds: { x: 20, y: 660, width: 160, height: 120 },
    capacity: 4,
    isPrivate: true,
  },
]
