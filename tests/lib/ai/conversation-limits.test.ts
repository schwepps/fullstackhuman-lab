import { describe, it, expect } from 'vitest'
import {
  MAX_USER_TURNS,
  WRAP_UP_START_TURN,
  FORCE_REPORT_TURN,
  MAX_CONTEXT_MESSAGES,
  getUserTurnCount,
  getConversationPhase,
  getRemainingTurns,
  getWrapUpInjection,
  truncateHistory,
} from '@/lib/ai/conversation-limits'

describe('conversation-limits constants', () => {
  it('exports expected constant values', () => {
    expect(MAX_USER_TURNS).toBe(15)
    expect(WRAP_UP_START_TURN).toBe(9)
    expect(FORCE_REPORT_TURN).toBe(12)
    expect(MAX_CONTEXT_MESSAGES).toBe(20)
  })

  it('maintains phase ordering invariant', () => {
    expect(WRAP_UP_START_TURN).toBeLessThan(FORCE_REPORT_TURN)
    expect(FORCE_REPORT_TURN).toBeLessThan(MAX_USER_TURNS)
  })
})

describe('getUserTurnCount', () => {
  it('returns 0 when no messages exist', () => {
    expect(getUserTurnCount(0)).toBe(0)
  })

  it('returns 0 for a single message (trigger only)', () => {
    expect(getUserTurnCount(1)).toBe(0)
  })

  it('returns 0 for two messages (trigger + opening)', () => {
    expect(getUserTurnCount(2)).toBe(0)
  })

  it('returns turn 1 for three messages (trigger + opening + first user message)', () => {
    expect(getUserTurnCount(3)).toBe(1)
  })

  it('returns turn 2 for five messages', () => {
    expect(getUserTurnCount(5)).toBe(2)
  })

  it('returns turn 8 for seventeen messages', () => {
    expect(getUserTurnCount(17)).toBe(8)
  })

  it('returns turn 9 for nineteen messages (wrap-up boundary)', () => {
    expect(getUserTurnCount(19)).toBe(9)
  })

  it('returns turn 12 for twenty-five messages (force-report boundary)', () => {
    expect(getUserTurnCount(25)).toBe(12)
  })

  it('returns turn 15 for thirty-one messages (hard-cap boundary)', () => {
    expect(getUserTurnCount(31)).toBe(15)
  })

  it('handles even message counts (mid-assistant-response)', () => {
    // messageCount=4 means assistant just responded after user turn 1
    // Math.floor((4-1)/2) = 1
    expect(getUserTurnCount(4)).toBe(1)
  })

  it('never returns negative values', () => {
    expect(getUserTurnCount(-1)).toBe(0)
    expect(getUserTurnCount(-100)).toBe(0)
  })
})

describe('getConversationPhase', () => {
  describe('normal phase (turns 0-8)', () => {
    it.each([0, 1, 4, 7, 8])('returns normal for turn %d', (turn) => {
      expect(getConversationPhase(turn)).toBe('normal')
    })
  })

  describe('wrap-up phase (turns 9-11)', () => {
    it.each([9, 10, 11])('returns wrap-up for turn %d', (turn) => {
      expect(getConversationPhase(turn)).toBe('wrap-up')
    })
  })

  describe('force-report phase (turns 12-14)', () => {
    it.each([12, 13, 14])('returns force-report for turn %d', (turn) => {
      expect(getConversationPhase(turn)).toBe('force-report')
    })
  })

  describe('hard-cap phase (turn 15+)', () => {
    it.each([15, 16, 20, 100])('returns hard-cap for turn %d', (turn) => {
      expect(getConversationPhase(turn)).toBe('hard-cap')
    })
  })

  it('transitions at exact boundary: 8 -> normal, 9 -> wrap-up', () => {
    expect(getConversationPhase(8)).toBe('normal')
    expect(getConversationPhase(WRAP_UP_START_TURN)).toBe('wrap-up')
  })

  it('transitions at exact boundary: 11 -> wrap-up, 12 -> force-report', () => {
    expect(getConversationPhase(11)).toBe('wrap-up')
    expect(getConversationPhase(FORCE_REPORT_TURN)).toBe('force-report')
  })

  it('transitions at exact boundary: 14 -> force-report, 15 -> hard-cap', () => {
    expect(getConversationPhase(14)).toBe('force-report')
    expect(getConversationPhase(MAX_USER_TURNS)).toBe('hard-cap')
  })
})

describe('getRemainingTurns', () => {
  it('returns max turns when no turns taken', () => {
    expect(getRemainingTurns(0)).toBe(MAX_USER_TURNS)
  })

  it('returns 6 at the start of wrap-up phase', () => {
    expect(getRemainingTurns(9)).toBe(6)
  })

  it('returns 3 at the start of force-report phase', () => {
    expect(getRemainingTurns(12)).toBe(3)
  })

  it('returns 0 at the hard cap', () => {
    expect(getRemainingTurns(15)).toBe(0)
  })

  it('never returns negative values beyond hard cap', () => {
    expect(getRemainingTurns(20)).toBe(0)
    expect(getRemainingTurns(100)).toBe(0)
  })

  it('decrements correctly for each turn', () => {
    for (let turn = 0; turn <= MAX_USER_TURNS; turn++) {
      expect(getRemainingTurns(turn)).toBe(MAX_USER_TURNS - turn)
    }
  })
})

describe('getWrapUpInjection', () => {
  describe('normal phase returns null', () => {
    it('returns null for turn 0', () => {
      expect(getWrapUpInjection(0)).toBeNull()
    })

    it('returns null for turn 5', () => {
      expect(getWrapUpInjection(5)).toBeNull()
    })

    it('returns null for turn 8 (last normal turn)', () => {
      expect(getWrapUpInjection(8)).toBeNull()
    })
  })

  describe('wrap-up phase returns guidance', () => {
    it('returns conversation_guidance tag at turn 9', () => {
      const result = getWrapUpInjection(9)
      expect(result).not.toBeNull()
      expect(result).toContain('conversation_guidance')
    })

    it('returns conversation_guidance tag at turn 11', () => {
      const result = getWrapUpInjection(11)
      expect(result).not.toBeNull()
      expect(result).toContain('conversation_guidance')
    })

    it('includes remaining turn count in wrap-up message', () => {
      const result = getWrapUpInjection(9)
      expect(result).toContain(`${getRemainingTurns(9)}`)
    })

    it('does not contain CRITICAL in wrap-up phase', () => {
      const result = getWrapUpInjection(9)
      expect(result).not.toContain('CRITICAL')
    })

    it('mentions steering toward report', () => {
      const result = getWrapUpInjection(10)
      expect(result).toContain('report')
    })
  })

  describe('force-report phase returns critical guidance', () => {
    it('returns CRITICAL text at turn 12', () => {
      const result = getWrapUpInjection(12)
      expect(result).not.toBeNull()
      expect(result).toContain('CRITICAL')
    })

    it('returns CRITICAL text at turn 14', () => {
      const result = getWrapUpInjection(14)
      expect(result).not.toBeNull()
      expect(result).toContain('CRITICAL')
    })

    it('instructs to generate report immediately', () => {
      const result = getWrapUpInjection(12)
      expect(result).toContain('report')
      expect(result).toContain('MUST')
    })

    it('wraps in conversation_guidance tag', () => {
      const result = getWrapUpInjection(12)
      expect(result).toContain('<conversation_guidance>')
      expect(result).toContain('</conversation_guidance>')
    })
  })

  describe('hard-cap phase returns null', () => {
    it('returns null at turn 15', () => {
      expect(getWrapUpInjection(15)).toBeNull()
    })

    it('returns null at turn 20', () => {
      expect(getWrapUpInjection(20)).toBeNull()
    })
  })
})

describe('truncateHistory', () => {
  it('returns the original array when under the limit', () => {
    const messages = Array.from({ length: 10 }, (_, i) => `msg-${i}`)
    const result = truncateHistory(messages)
    expect(result).toBe(messages) // same reference, not a copy
  })

  it('returns the original array when exactly at the limit', () => {
    const messages = Array.from(
      { length: MAX_CONTEXT_MESSAGES },
      (_, i) => `msg-${i}`
    )
    const result = truncateHistory(messages)
    expect(result).toBe(messages)
  })

  it('truncates to MAX_CONTEXT_MESSAGES when over the limit', () => {
    const messages = Array.from({ length: 25 }, (_, i) => `msg-${i}`)
    const result = truncateHistory(messages)
    expect(result).toHaveLength(MAX_CONTEXT_MESSAGES)
  })

  it('preserves the first message (trigger) when truncating', () => {
    const messages = Array.from({ length: 25 }, (_, i) => `msg-${i}`)
    const result = truncateHistory(messages)
    expect(result[0]).toBe('msg-0')
  })

  it('keeps the last 19 messages when truncating 25', () => {
    const messages = Array.from({ length: 25 }, (_, i) => `msg-${i}`)
    const result = truncateHistory(messages)
    // First element is msg-0, then last 19 are msg-6 through msg-24
    expect(result[0]).toBe('msg-0')
    expect(result[1]).toBe('msg-6')
    expect(result[result.length - 1]).toBe('msg-24')
  })

  it('keeps the last 19 messages when truncating 30', () => {
    const messages = Array.from({ length: 30 }, (_, i) => `msg-${i}`)
    const result = truncateHistory(messages)
    expect(result).toHaveLength(MAX_CONTEXT_MESSAGES)
    expect(result[0]).toBe('msg-0')
    expect(result[1]).toBe('msg-11')
    expect(result[result.length - 1]).toBe('msg-29')
  })

  it('handles an empty array', () => {
    const result = truncateHistory([])
    expect(result).toEqual([])
  })

  it('handles a single message', () => {
    const messages = ['only-message']
    const result = truncateHistory(messages)
    expect(result).toBe(messages)
    expect(result).toEqual(['only-message'])
  })

  it('preserves generic types correctly', () => {
    interface TestMessage {
      id: number
      content: string
    }
    const messages: TestMessage[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      content: `content-${i}`,
    }))
    const result = truncateHistory(messages)
    expect(result).toHaveLength(MAX_CONTEXT_MESSAGES)
    expect(result[0]).toEqual({ id: 0, content: 'content-0' })
    expect(result[1]).toEqual({ id: 6, content: 'content-6' })
    expect(result[result.length - 1]).toEqual({ id: 24, content: 'content-24' })
  })

  it('drops the correct middle messages', () => {
    const messages = Array.from({ length: 25 }, (_, i) => i)
    const result = truncateHistory(messages)
    // Should drop messages at indices 1-5 (messages 1, 2, 3, 4, 5)
    const expected = [
      0, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    ]
    expect(result).toEqual(expected)
  })
})

describe('integration: getUserTurnCount -> getConversationPhase', () => {
  it('maps message count through the full pipeline correctly', () => {
    // 3 messages = turn 1 -> normal
    expect(getConversationPhase(getUserTurnCount(3))).toBe('normal')
    // 19 messages = turn 9 -> wrap-up
    expect(getConversationPhase(getUserTurnCount(19))).toBe('wrap-up')
    // 25 messages = turn 12 -> force-report
    expect(getConversationPhase(getUserTurnCount(25))).toBe('force-report')
    // 31 messages = turn 15 -> hard-cap
    expect(getConversationPhase(getUserTurnCount(31))).toBe('hard-cap')
  })

  it('wrap-up injection is generated at the correct message counts', () => {
    // 17 messages = turn 8 -> normal -> null
    expect(getWrapUpInjection(getUserTurnCount(17))).toBeNull()
    // 19 messages = turn 9 -> wrap-up -> guidance
    expect(getWrapUpInjection(getUserTurnCount(19))).toContain(
      'conversation_guidance'
    )
    // 25 messages = turn 12 -> force-report -> CRITICAL
    expect(getWrapUpInjection(getUserTurnCount(25))).toContain('CRITICAL')
    // 31 messages = turn 15 -> hard-cap -> null
    expect(getWrapUpInjection(getUserTurnCount(31))).toBeNull()
  })
})
