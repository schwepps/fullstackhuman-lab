import { describe, it, expect } from 'vitest'
import { calculateScores } from '@/lib/game/score-calculator'
import type { Room, Player } from '@/lib/game/types'

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    displayName: 'Test',
    type: 'human',
    model: 'claude-sonnet-4-6',
    revealPreference: 'public',
    position: { x: 0, y: 0 },
    currentZone: 'main',
    avatarColor: 0x22d3ee,
    isConnected: true,
    isEliminated: false,
    score: 0,
    roundsSurvived: 0,
    correctVotes: 0,
    sessionToken: 'tok',
    chatHistory: [],
    ...overrides,
  }
}

function createRoom(players: Map<string, Player>): Room {
  return {
    id: 'room-1',
    hostId: 'p1',
    phase: 'reveal',
    round: 4,
    maxRounds: 4,
    roundDuration: 180,
    players,
    votes: new Map(),
    roundResults: [],
    createdAt: Date.now(),
  }
}

describe('calculateScores', () => {
  it('human: 2 correct votes, survived 3 rounds, never eliminated = 100', () => {
    const players = new Map([
      [
        'p1',
        createPlayer({
          id: 'p1',
          correctVotes: 2,
          roundsSurvived: 3,
          isEliminated: false,
        }),
      ],
    ])
    const scores = calculateScores(createRoom(players))
    // 2*20 + 3*10 + 30 = 40 + 30 + 30 = 100
    expect(scores.get('p1')).toBe(100)
  })

  it('human eliminated in round 2, 1 correct post-elimination vote = 15', () => {
    const players = new Map([
      [
        'p1',
        createPlayer({
          id: 'p1',
          correctVotes: 1,
          roundsSurvived: 2,
          isEliminated: true,
        }),
      ],
    ])
    const scores = calculateScores(createRoom(players))
    // Eliminated: 1*15 = 15
    expect(scores.get('p1')).toBe(15)
  })

  it('spectator with 3 correct IDs = 45', () => {
    const players = new Map([
      [
        'p1',
        createPlayer({
          id: 'p1',
          type: 'spectator',
          correctVotes: 3,
        }),
      ],
    ])
    const scores = calculateScores(createRoom(players))
    // 3*15 = 45
    expect(scores.get('p1')).toBe(45)
  })

  it('agents get score 0', () => {
    const players = new Map([
      [
        'agent-1',
        createPlayer({
          id: 'agent-1',
          type: 'auto-agent',
          correctVotes: 5,
          roundsSurvived: 4,
        }),
      ],
    ])
    const scores = calculateScores(createRoom(players))
    expect(scores.get('agent-1')).toBe(0)
  })
})
