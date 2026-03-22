import { describe, it, expect } from 'vitest'
import { generateRoomCode } from '@/lib/room-manager'
import { ROOM_CODE_LENGTH } from '@/lib/constants'

describe('generateRoomCode', () => {
  it('generates a code of correct length', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(ROOM_CODE_LENGTH)
  })

  it('generates only valid characters (no O/0/1/I)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode()
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/)
    }
  })

  it('generates unique codes', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 50; i++) {
      codes.add(generateRoomCode())
    }
    // With 28^6 = ~481M possible codes, 50 should all be unique
    expect(codes.size).toBe(50)
  })
})
