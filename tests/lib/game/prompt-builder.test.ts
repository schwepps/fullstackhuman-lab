import { describe, it, expect } from 'vitest'
import { buildChatPrompt, buildVotePrompt } from '@/lib/game/prompt-builder'
import type { AgentMemoryContext } from '@/lib/game/prompt-builder'
import type { Player, Room } from '@/lib/game/types'

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'maya',
    displayName: 'Maya',
    type: 'auto-agent',
    model: 'claude-haiku-4-5',
    revealPreference: 'public',
    position: { x: 100, y: 200 },
    currentZone: 'main',
    avatarColor: 0x22d3ee,
    isConnected: true,
    isEliminated: false,
    score: 0,
    roundsSurvived: 0,
    correctVotes: 0,
    sessionToken: 'token-abc',
    chatHistory: [],
    ...overrides,
  }
}

function createTestRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'test-room',
    hostId: 'player-1',
    phase: 'round',
    round: 1,
    maxRounds: 4,
    roundDuration: 180,
    currentTopic: 'What is your earliest memory?',
    players: new Map(),
    votes: new Map(),
    roundResults: [],
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('buildChatPrompt', () => {
  it('includes lowercase style for maya persona', () => {
    const agent = createTestPlayer({ id: 'maya', type: 'auto-agent' })
    const room = createTestRoom()
    const prompt = buildChatPrompt(agent, room)

    expect(prompt).toContain('lowercase')
    expect(prompt).toContain('What is your earliest memory?')
    expect(prompt).toContain('Maya')
    expect(prompt).toContain('27 years old')
  })

  it('includes formal style for thomas persona', () => {
    const agent = createTestPlayer({
      id: 'thomas',
      type: 'auto-agent',
      displayName: 'Thomas',
    })
    const room = createTestRoom()
    const prompt = buildChatPrompt(agent, room)

    expect(prompt).toContain('formal')
    expect(prompt).toContain('Thomas')
    expect(prompt).toContain('44 years old')
    expect(prompt).not.toContain('lowercase')
  })

  it('uses customPrompt for custom-agent', () => {
    const agent = createTestPlayer({
      id: 'custom-1',
      type: 'custom-agent',
      customPrompt: 'You are a pirate named Blackbeard.',
    })
    const room = createTestRoom()
    const prompt = buildChatPrompt(agent, room)

    expect(prompt).toContain('You are a pirate named Blackbeard.')
    expect(prompt).toContain('PLAYER DESCRIPTION')
    expect(prompt).toContain('What is your earliest memory?')
  })

  it('falls back to first persona when id not found', () => {
    const agent = createTestPlayer({
      id: 'unknown-agent',
      type: 'auto-agent',
    })
    const room = createTestRoom()
    const prompt = buildChatPrompt(agent, room)

    // Falls back to first persona (Maya)
    expect(prompt).toContain('Maya')
  })

  it('injects topic into auto-agent prompt', () => {
    const agent = createTestPlayer({ id: 'jade', type: 'auto-agent' })
    const room = createTestRoom({
      currentTopic: 'Describe your perfect weekend',
    })
    const prompt = buildChatPrompt(agent, room)

    expect(prompt).toContain('Describe your perfect weekend')
  })

  it('includes self-memory when provided', () => {
    const agent = createTestPlayer({ id: 'maya', type: 'auto-agent' })
    const room = createTestRoom()
    const memory: AgentMemoryContext = {
      selfMessages: ['i work at a bookshop lol', 'yeah im from lyon'],
      crossZoneContext: [],
    }
    const prompt = buildChatPrompt(agent, room, memory)

    expect(prompt).toContain("THINGS YOU'VE SAID")
    expect(prompt).toContain('i work at a bookshop lol')
    expect(prompt).toContain('yeah im from lyon')
    expect(prompt).toContain('Stay consistent')
  })

  it('includes cross-zone context when provided', () => {
    const agent = createTestPlayer({ id: 'thomas', type: 'auto-agent' })
    const room = createTestRoom()
    const memory: AgentMemoryContext = {
      selfMessages: [],
      crossZoneContext: [
        { displayName: 'Maya', content: 'im a student in paris' },
      ],
    }
    const prompt = buildChatPrompt(agent, room, memory)

    expect(prompt).toContain('WHAT OTHERS SAID IN OTHER AREAS')
    expect(prompt).toContain('Maya: "im a student in paris"')
  })

  it('omits memory sections when both are empty', () => {
    const agent = createTestPlayer({ id: 'maya', type: 'auto-agent' })
    const room = createTestRoom()
    const memory: AgentMemoryContext = {
      selfMessages: [],
      crossZoneContext: [],
    }
    const prompt = buildChatPrompt(agent, room, memory)

    expect(prompt).not.toContain("THINGS YOU'VE SAID")
    expect(prompt).not.toContain('WHAT OTHERS SAID')
  })
})

describe('buildVotePrompt', () => {
  it('includes candidate names', () => {
    const agent = createTestPlayer({ chatHistory: [] })
    const room = createTestRoom()
    const candidates = [
      createTestPlayer({ id: 'p1', displayName: 'Alice' }),
      createTestPlayer({ id: 'p2', displayName: 'Bob' }),
    ]

    const prompt = buildVotePrompt(agent, room, candidates)

    expect(prompt).toContain('Alice, Bob')
  })

  it('includes conversation excerpts from chat history', () => {
    const agent = createTestPlayer({
      chatHistory: [
        {
          zone: 'main',
          messages: [
            {
              id: 'm1',
              playerId: 'p1',
              displayName: 'Alice',
              content: 'I love hiking in the Alps',
              zone: 'main',
              timestamp: 1000,
            },
            {
              id: 'm2',
              playerId: 'p2',
              displayName: 'Bob',
              content: 'That sounds fun',
              zone: 'main',
              timestamp: 2000,
            },
          ],
        },
      ],
    })
    const room = createTestRoom()
    const candidates = [createTestPlayer({ id: 'p1', displayName: 'Alice' })]

    const prompt = buildVotePrompt(agent, room, candidates)

    expect(prompt).toContain('[Alice in main]: I love hiking in the Alps')
    expect(prompt).toContain('[Bob in main]: That sounds fun')
  })

  it('shows empty message when no conversations', () => {
    const agent = createTestPlayer({ chatHistory: [] })
    const room = createTestRoom()
    const prompt = buildVotePrompt(agent, room, [])

    expect(prompt).toContain('(no conversations yet)')
  })
})
