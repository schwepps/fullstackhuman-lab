import type * as Party from 'partykit/server'
import type { Player, PublicPlayer } from '../../lib/game/types'
import { AVATAR_COLORS } from '../../lib/game/constants'
import type { GameState } from './game-state'

export async function handleConnect(
  conn: Party.Connection,
  ctx: Party.ConnectionContext,
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  const url = new URL(ctx.request.url)
  const sessionToken = url.searchParams.get('sessionToken')
  const requestedPlayerId = url.searchParams.get('playerId')

  // Reconnection path
  if (requestedPlayerId && sessionToken) {
    const roomData = await getRoomData(roomId)
    if (!roomData) {
      conn.close(4004, 'Room not found')
      return
    }

    const player = roomData.players.get(requestedPlayerId)

    if (player && player.sessionToken === sessionToken) {
      state.connToPlayer.set(conn.id, requestedPlayerId)
      state.positions.set(requestedPlayerId, player.position)
      state.zones.set(requestedPlayerId, player.currentZone)
      state.displayNames.set(requestedPlayerId, player.displayName)
      state.assignedColors.add(player.avatarColor)
      state.playerColors.set(requestedPlayerId, player.avatarColor)

      try {
        const { roomStore } = await import('../../lib/game/room-store')
        await roomStore.update(roomId, (r) => {
          const p = r.players.get(requestedPlayerId)
          if (p) p.isConnected = true
          return r
        })
      } catch {
        // Non-critical
      }

      conn.send(
        JSON.stringify({
          type: 'reconnected',
          phase: state.currentPhase,
          round: roomData.round,
          topic: roomData.currentTopic,
          yourPlayerId: requestedPlayerId,
          yourColor: player.avatarColor,
          roundStartedAt: roomData.roundStartedAt,
        })
      )

      sendPositionUpdates(conn, state)

      partyRoom.broadcast(
        JSON.stringify({
          type: 'player_joined',
          player: {
            id: requestedPlayerId,
            displayName: player.displayName,
            avatarColor: player.avatarColor,
            isConnected: true,
            isEliminated: player.isEliminated,
          },
        }),
        [conn.id]
      )
      return
    }
    // Invalid session — fall through to fresh join
  }

  // Fresh join
  const color =
    AVATAR_COLORS.find((c) => !state.assignedColors.has(c)) ?? AVATAR_COLORS[0]
  state.assignedColors.add(color)
  state.playerColors.set(conn.id, color)

  const newSessionToken = crypto.randomUUID()
  state.connToPlayer.set(conn.id, conn.id)
  state.sessionTokens.set(conn.id, newSessionToken)

  conn.send(
    JSON.stringify({
      type: 'phase_change',
      phase: state.currentPhase,
      yourPlayerId: conn.id,
      yourColor: color,
      sessionToken: newSessionToken,
    })
  )

  const publicPlayer: Partial<PublicPlayer> = {
    id: conn.id,
    avatarColor: color,
    isConnected: true,
    isEliminated: false,
  }
  partyRoom.broadcast(
    JSON.stringify({ type: 'player_joined', player: publicPlayer }),
    [conn.id]
  )

  sendPositionUpdates(conn, state)
  sendLobbySyncToNewJoiner(conn, state)

  // Persist player to Redis
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    const existing = await roomStore.get(roomId)

    const newPlayer: Player = {
      id: conn.id,
      displayName: conn.id.slice(0, 6),
      type: 'human',
      model: 'claude-sonnet-4-6',
      revealPreference: 'public',
      position: { x: 600, y: 400 },
      currentZone: 'main',
      avatarColor: color,
      isConnected: true,
      isEliminated: false,
      score: 0,
      roundsSurvived: 0,
      correctVotes: 0,
      sessionToken: newSessionToken,
      chatHistory: [],
    }

    if (existing) {
      await roomStore.update(roomId, (r) => {
        r.players.set(conn.id, newPlayer)
        return r
      })
    } else {
      await roomStore.create({
        id: roomId,
        hostId: conn.id,
        phase: 'lobby',
        round: 0,
        maxRounds: 4,
        roundDuration: 180,
        players: new Map([[conn.id, newPlayer]]),
        votes: new Map(),
        roundResults: [],
        createdAt: Date.now(),
      })
    }
  } catch {
    // Redis may be unavailable
  }
}

function sendPositionUpdates(conn: Party.Connection, state: GameState) {
  const posUpdates = Array.from(state.positions.entries()).map(([id, pos]) => ({
    playerId: id,
    position: pos,
    zone: state.zones.get(id) ?? 'main',
  }))
  if (posUpdates.length) {
    conn.send(JSON.stringify({ type: 'position_update', updates: posUpdates }))
  }
}

function sendLobbySyncToNewJoiner(conn: Party.Connection, state: GameState) {
  const sentPlayerIds = new Set<string>()
  for (const [existingConnId, existingPlayerId] of state.connToPlayer) {
    if (existingConnId === conn.id) continue
    if (sentPlayerIds.has(existingPlayerId)) continue
    sentPlayerIds.add(existingPlayerId)
    conn.send(
      JSON.stringify({
        type: 'player_joined',
        player: {
          id: existingPlayerId,
          displayName:
            state.displayNames.get(existingPlayerId) ??
            existingPlayerId.slice(0, 6),
          avatarColor:
            state.playerColors.get(existingPlayerId) ?? AVATAR_COLORS[0],
          isConnected: true,
          isEliminated: false,
        },
      })
    )
  }
}

async function getRoomData(roomId: string) {
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    return await roomStore.get(roomId)
  } catch {
    return null
  }
}
