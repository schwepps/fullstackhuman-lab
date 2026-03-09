import type * as Party from 'partykit/server'
import type { Player, PublicPlayer } from '../../lib/game/types'
import {
  AVATAR_COLORS,
  DEFAULT_AVATAR_COLOR,
  DEFAULT_SPAWN_POSITION,
  FALLBACK_NAME_LENGTH,
  MAX_PLAYERS_PER_ROOM,
  ROOM_ID_PATTERN,
} from '../../lib/game/constants'
import type { GameState } from './game-state'

export async function handleConnect(
  conn: Party.Connection,
  ctx: Party.ConnectionContext,
  partyRoom: Party.Room,
  roomId: string,
  state: GameState
) {
  // Validate room ID
  if (!ROOM_ID_PATTERN.test(roomId)) {
    conn.close(4001, 'Invalid room ID')
    return
  }

  // Enforce player cap (reconnections bypass — they're re-joining, not adding)
  const url = new URL(ctx.request.url)
  const sessionToken = url.searchParams.get('sessionToken')
  const requestedPlayerId = url.searchParams.get('playerId')
  const isReconnection = requestedPlayerId && sessionToken

  if (!isReconnection && state.connToPlayer.size >= MAX_PLAYERS_PER_ROOM) {
    conn.close(4003, 'Room is full')
    return
  }

  // Reconnection path
  if (requestedPlayerId && sessionToken) {
    const roomData = await getRoomData(roomId)
    const player = roomData?.players.get(requestedPlayerId)

    if (roomData && player && player.sessionToken === sessionToken) {
      state.connToPlayer.set(conn.id, requestedPlayerId)
      state.positions.set(requestedPlayerId, player.position)
      state.zones.set(requestedPlayerId, player.currentZone)
      state.displayNames.set(requestedPlayerId, player.displayName)
      state.assignedColors.add(player.avatarColor)
      state.playerColors.set(requestedPlayerId, player.avatarColor)

      // Mark reconnected in Redis — fire-and-forget
      import('../../lib/game/room-store')
        .then(({ roomStore }) =>
          roomStore.update(roomId, (r) => {
            const p = r.players.get(requestedPlayerId)
            if (p) p.isConnected = true
            return r
          })
        )
        .catch((e) =>
          console.error('[handleConnect] Redis reconnect update failed:', e)
        )

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
            position: player.position,
            isConnected: true,
            isEliminated: player.isEliminated,
          },
        }),
        [conn.id]
      )
      return
    }
    // Room not found or invalid session — fall through to fresh join
  }

  // Fresh join
  const color =
    AVATAR_COLORS.find((c) => !state.assignedColors.has(c)) ??
    DEFAULT_AVATAR_COLOR
  state.assignedColors.add(color)
  state.playerColors.set(conn.id, color)

  // Late joiner → spectator (game already in progress)
  if (state.currentPhase !== 'lobby') {
    state.spectators.add(conn.id)
    conn.send(
      JSON.stringify({
        type: 'phase_change',
        phase: state.currentPhase,
        yourPlayerId: conn.id,
        yourColor: color,
        isSpectator: true,
      })
    )
    sendFullPlayerList(conn, state)
    sendPositionUpdates(conn, state)
    return
  }

  const newSessionToken = crypto.randomUUID()
  state.connToPlayer.set(conn.id, conn.id)
  state.sessionTokens.set(conn.id, newSessionToken)
  state.zones.set(conn.id, 'main')
  state.positions.set(conn.id, { ...DEFAULT_SPAWN_POSITION })

  // First player in the room is the host
  if (!state.hostId) state.hostId = conn.id
  const isFirstPlayer = state.hostId === conn.id

  conn.send(
    JSON.stringify({
      type: 'phase_change',
      phase: state.currentPhase,
      yourPlayerId: conn.id,
      yourColor: color,
      sessionToken: newSessionToken,
      isHost: isFirstPlayer,
    })
  )

  const publicPlayer: Partial<PublicPlayer> = {
    id: conn.id,
    displayName:
      state.displayNames.get(conn.id) ?? conn.id.slice(0, FALLBACK_NAME_LENGTH),
    avatarColor: color,
    position: state.positions.get(conn.id),
    isConnected: true,
    isEliminated: false,
  }
  partyRoom.broadcast(
    JSON.stringify({ type: 'player_joined', player: publicPlayer }),
    [conn.id]
  )

  sendFullPlayerList(conn, state)
  sendPositionUpdates(conn, state)

  // Persist player to Redis — fire-and-forget to avoid blocking the WebSocket.
  // Upstash REST calls can hang in workerd/miniflare, killing the Durable Object.
  persistNewPlayer(roomId, conn.id, newSessionToken, color).catch((e) =>
    console.error('[handleConnect] Redis persist failed:', e)
  )
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

/** Send full player list (humans from connToPlayer + agents from positions) */
function sendFullPlayerList(conn: Party.Connection, state: GameState) {
  const sentPlayerIds = new Set<string>()
  const ownPlayerId = state.connToPlayer.get(conn.id)

  // Human players (from WebSocket connections)
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
            existingPlayerId.slice(0, FALLBACK_NAME_LENGTH),
          avatarColor:
            state.playerColors.get(existingPlayerId) ?? DEFAULT_AVATAR_COLOR,
          position: state.positions.get(existingPlayerId),
          isConnected: true,
          isEliminated: false,
        },
      })
    )
  }

  // Agents and any other players in positions but not in connToPlayer
  for (const [playerId] of state.positions) {
    if (sentPlayerIds.has(playerId)) continue
    if (playerId === ownPlayerId) continue
    sentPlayerIds.add(playerId)
    conn.send(
      JSON.stringify({
        type: 'player_joined',
        player: {
          id: playerId,
          displayName:
            state.displayNames.get(playerId) ??
            playerId.slice(0, FALLBACK_NAME_LENGTH),
          avatarColor: state.playerColors.get(playerId) ?? DEFAULT_AVATAR_COLOR,
          position: state.positions.get(playerId),
          isConnected: true,
          isEliminated: false,
        },
      })
    )
  }
}

async function persistNewPlayer(
  roomId: string,
  connId: string,
  sessionToken: string,
  color: number
) {
  const { roomStore } = await import('../../lib/game/room-store')
  const existing = await roomStore.get(roomId)

  const newPlayer: Player = {
    id: connId,
    displayName: connId.slice(0, FALLBACK_NAME_LENGTH),
    type: 'human',
    model: 'claude-sonnet-4-6',
    revealPreference: 'public',
    position: { ...DEFAULT_SPAWN_POSITION },
    currentZone: 'main',
    avatarColor: color,
    isConnected: true,
    isEliminated: false,
    score: 0,
    roundsSurvived: 0,
    correctVotes: 0,
    sessionToken,
    chatHistory: [],
  }

  if (existing) {
    await roomStore.update(roomId, (r) => {
      r.players.set(connId, newPlayer)
      return r
    })
  } else {
    await roomStore.create({
      id: roomId,
      hostId: connId,
      phase: 'lobby',
      round: 0,
      maxRounds: 4,
      roundDuration: 180,
      players: new Map([[connId, newPlayer]]),
      votes: new Map(),
      roundResults: [],
      createdAt: Date.now(),
    })
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
