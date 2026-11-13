import { describe, it, expect, vi, beforeEach } from 'vitest'
import type * as Party from 'partykit/server'
import type { Player, PlayerType, Room } from '@/lib/game/types'
import type { GameState } from '../../partykit/src/game-state'

let room: Room

vi.mock('../../lib/game/room-store', () => ({
  roomStore: {
    get: async () => room,
    update: async (_id: string, updater: (r: Room) => Room) => updater(room),
  },
}))

const generateAgentVote = vi.fn()
vi.mock('../../partykit/src/agent-manager', () => ({
  generateAgentVote: (...args: unknown[]) => generateAgentVote(...args),
}))

import { handleVote } from '../../partykit/src/vote-manager'

function player(id: string, type: PlayerType = 'human'): Player {
  return {
    id,
    displayName: id,
    type,
    isEliminated: false,
    correctVotes: 0,
    roundsSurvived: 0,
  } as Player
}

function setup(players: Player[]) {
  room = {
    id: 'room1',
    round: 1,
    maxRounds: 4,
    players: new Map(players.map((p) => [p.id, p])),
    votes: new Map(),
    roundResults: [],
  } as unknown as Room

  const setAlarm = vi.fn()
  const partyRoom = {
    broadcast: vi.fn(),
    storage: { put: vi.fn(), setAlarm },
  } as unknown as Party.Room
  const state = {
    isVoteResolved: false,
    hasRequestedAgentVotes: false,
    eliminatedPlayers: new Set<string>(),
  } as GameState

  const vote = (voterId: string | null, targetId: string | null) =>
    handleVote(partyRoom, voterId, targetId, 'room1', state)

  return { vote, setAlarm }
}

beforeEach(() => {
  generateAgentVote.mockReset()
})

describe('handleVote', () => {
  it('ignores votes for unknown players and still moves on at the timeout', async () => {
    const { vote, setAlarm } = setup([player('a'), player('b'), player('c')])

    await vote('a', 'ghost')
    await vote('b', 'ghost')
    expect(room.votes.size).toBe(0)

    await vote(null, null)

    expect(room.roundResults).toHaveLength(0)
    expect(setAlarm).toHaveBeenCalledTimes(1)
  })

  it('tallies a round once, whatever arrives afterwards', async () => {
    const { vote, setAlarm } = setup([
      player('a'),
      player('b'),
      player('bot', 'auto-agent'),
    ])
    generateAgentVote.mockResolvedValue('a')

    await vote('a', 'bot')
    await vote('b', 'bot')

    expect(room.players.get('bot')?.isEliminated).toBe(true)
    expect(room.roundResults).toHaveLength(1)
    expect(room.players.get('a')?.correctVotes).toBe(1)

    await vote(null, null) // the vote timer firing late
    await vote('a', 'bot') // a player re-sending their vote

    expect(room.roundResults).toHaveLength(1)
    expect(room.players.get('a')?.correctVotes).toBe(1)
    expect(setAlarm).toHaveBeenCalledTimes(1)
  })

  it('asks each agent for its vote once per vote phase', async () => {
    const { vote } = setup([
      player('a'),
      player('b'),
      player('c'),
      player('bot', 'auto-agent'),
    ])
    generateAgentVote.mockResolvedValue(null) // unusable answer

    await vote('a', 'b')
    await vote('a', 'b')
    await vote('b', 'a')

    expect(generateAgentVote).toHaveBeenCalledTimes(1)
  })
})
