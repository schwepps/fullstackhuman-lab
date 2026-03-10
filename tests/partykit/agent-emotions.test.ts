import { describe, it, expect } from 'vitest'
import {
  updateEmotionOnMessage,
  decayEmotion,
  resetEmotionsForRound,
  getEmotionalPromptContext,
} from '@/partykit/src/agent-emotions'
import type { GameState } from '@/partykit/src/game-state'
import {
  AGENT_BOREDOM_THRESHOLD_MS,
  AGENT_MOOD_DECAY_MS,
} from '@/lib/game/constants'

function createMockState(
  overrides: Partial<GameState> = {}
): Pick<GameState, 'agentEmotions'> & GameState {
  return {
    agentEmotions: new Map(),
    ...overrides,
  } as GameState
}

describe('updateEmotionOnMessage', () => {
  it('sets defensive mood when agent is accused', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'neutral',
      trigger: 'game started',
      since: Date.now(),
    })

    updateEmotionOnMessage(
      state,
      'maya',
      'Player1',
      'maya is definitely a bot',
      'Maya'
    )

    expect(state.agentEmotions.get('maya')?.mood).toBe('defensive')
    expect(state.agentEmotions.get('maya')?.trigger).toBe('someone accused you')
  })

  it('sets engaged mood when agent is mentioned without accusation', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'neutral',
      trigger: 'game started',
      since: Date.now(),
    })

    updateEmotionOnMessage(
      state,
      'maya',
      'Player1',
      'hey maya whats up',
      'Maya'
    )

    expect(state.agentEmotions.get('maya')?.mood).toBe('engaged')
    expect(state.agentEmotions.get('maya')?.trigger).toBe(
      'someone mentioned you'
    )
  })

  it('sets engaged from bored when general conversation happens', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'bored',
      trigger: 'nothing happening',
      since: Date.now(),
    })

    updateEmotionOnMessage(
      state,
      'maya',
      'Player1',
      'random chat message',
      'Maya'
    )

    expect(state.agentEmotions.get('maya')?.mood).toBe('engaged')
  })

  it('does not override active mood with generic engagement', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'defensive',
      trigger: 'someone accused you',
      since: Date.now(),
    })

    updateEmotionOnMessage(
      state,
      'maya',
      'Player1',
      'random chat message',
      'Maya'
    )

    // Should stay defensive — not overridden by generic engagement
    expect(state.agentEmotions.get('maya')?.mood).toBe('defensive')
  })
})

describe('decayEmotion', () => {
  it('initializes neutral mood when no emotion exists', () => {
    const state = createMockState()

    decayEmotion(state, 'maya')

    expect(state.agentEmotions.get('maya')?.mood).toBe('neutral')
  })

  it('decays defensive to suspicious after timeout', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'defensive',
      trigger: 'someone accused you',
      since: Date.now() - AGENT_MOOD_DECAY_MS - 1000,
    })

    decayEmotion(state, 'maya')

    expect(state.agentEmotions.get('maya')?.mood).toBe('suspicious')
  })

  it('decays suspicious to neutral after timeout', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'suspicious',
      trigger: 'time passed',
      since: Date.now() - AGENT_MOOD_DECAY_MS - 1000,
    })

    decayEmotion(state, 'maya')

    expect(state.agentEmotions.get('maya')?.mood).toBe('neutral')
  })

  it('decays neutral to bored after boredom threshold', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'neutral',
      trigger: 'time passed',
      since: Date.now() - AGENT_BOREDOM_THRESHOLD_MS - 1000,
    })

    decayEmotion(state, 'maya')

    expect(state.agentEmotions.get('maya')?.mood).toBe('bored')
  })

  it('does not decay bored further', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'bored',
      trigger: 'nothing happening',
      since: Date.now() - AGENT_MOOD_DECAY_MS - 1000,
    })

    decayEmotion(state, 'maya')

    expect(state.agentEmotions.get('maya')?.mood).toBe('bored')
  })
})

describe('resetEmotionsForRound', () => {
  it('resets all agents to engaged', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'bored',
      trigger: 'nothing happening',
      since: Date.now(),
    })
    state.agentEmotions.set('thomas', {
      mood: 'defensive',
      trigger: 'someone accused you',
      since: Date.now(),
    })

    resetEmotionsForRound(state)

    expect(state.agentEmotions.get('maya')?.mood).toBe('engaged')
    expect(state.agentEmotions.get('thomas')?.mood).toBe('engaged')
    expect(state.agentEmotions.get('maya')?.trigger).toBe('new round started')
  })
})

describe('getEmotionalPromptContext', () => {
  it('returns null for neutral mood', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'neutral',
      trigger: 'game started',
      since: Date.now(),
    })

    expect(getEmotionalPromptContext(state, 'maya')).toBeNull()
  })

  it('returns null when no emotion exists', () => {
    const state = createMockState()

    expect(getEmotionalPromptContext(state, 'maya')).toBeNull()
  })

  it('returns mood description for engaged', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'engaged',
      trigger: 'active conversation',
      since: Date.now(),
    })

    const result = getEmotionalPromptContext(state, 'maya')
    expect(result).toContain('engaged')
    expect(result).toContain('active conversation')
  })

  it('returns mood description for defensive', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'defensive',
      trigger: 'someone accused you',
      since: Date.now(),
    })

    const result = getEmotionalPromptContext(state, 'maya')
    expect(result).toContain('defensive')
    expect(result).toContain('someone accused you')
  })

  it('returns mood description for bored', () => {
    const state = createMockState()
    state.agentEmotions.set('maya', {
      mood: 'bored',
      trigger: 'nothing happening',
      since: Date.now(),
    })

    const result = getEmotionalPromptContext(state, 'maya')
    expect(result).toContain('bored')
    expect(result).toContain('nothing happening')
  })
})
