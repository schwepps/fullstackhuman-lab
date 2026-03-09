import type * as Party from 'partykit/server'
import type { Position, ChatScope, GamePhase } from '../../lib/game/types'
import {
  ALARM_ROUND_END,
  ALARM_VOTE_END,
  ALARM_START_ROUND,
} from '../../lib/game/constants'
import type { GameState } from './game-state'
import { handleConnect } from './connection-handler'
import { handleChat } from './chat-handler'
import { handleReady, startRound, endRound } from './lobby-handler'
import { applyMove } from './movement-handler'
import { PERSONAS } from '../../lib/game/agent-personas'

/** Strip zero-width chars, control chars, and check against reserved persona names */
function sanitizeDisplayName(
  raw: string,
  state: GameState
): string | undefined {
  // Strip non-printable and zero-width characters
  const cleaned = raw
    .trim()
    .replace(
      /[\u200B-\u200F\u2028-\u202F\uFEFF\u0000-\u001F\u007F-\u009F]/g,
      ''
    )
    .slice(0, 16)
  if (!cleaned) return undefined

  // Block names matching AI persona names (case-insensitive)
  const lower = cleaned.toLowerCase()
  const isReserved = PERSONAS.some((p) => p.name.toLowerCase() === lower)
  if (isReserved) return undefined

  // Block duplicates
  for (const [, existing] of state.displayNames) {
    if (existing.toLowerCase() === lower) return undefined
  }

  return cleaned
}

export default class GameRoom implements Party.Server {
  state: GameState = {
    currentPhase: 'lobby' as GamePhase,
    hostId: null,
    positions: new Map(),
    zones: new Map(),
    connToPlayer: new Map(),
    zoneWriteDebounce: new Map(),
    assignedColors: new Set(),
    playerColors: new Map(),
    displayNames: new Map(),
    sessionTokens: new Map(),
    chatTimestamps: new Map(),
    agentMovement: new Map(),
    agentChatCooldowns: new Map(),
    zoneAgentMsgCount: new Map(),
    agentIntervalId: null,
    agentRoundStartedAt: 0,
  }

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    await handleConnect(conn, ctx, this.room, this.room.id, this.state)
  }

  async onMessage(message: string, sender: Party.Connection) {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }

    const playerId = this.state.connToPlayer.get(sender.id) ?? sender.id
    if (typeof msg.type !== 'string') return

    switch (msg.type) {
      case 'move':
      case 'move-to': {
        const pos = (msg.type === 'move' ? msg.position : msg.target) as
          | { x?: unknown; y?: unknown }
          | undefined
        if (typeof pos?.x !== 'number' || typeof pos?.y !== 'number') return
        applyMove(playerId, pos as Position, this.state, this.room, {
          skipBroadcastToSender: true,
        })
        break
      }
      case 'chat':
        if (typeof msg.content !== 'string' || typeof msg.zone !== 'string')
          return
        await handleChat(
          this.room,
          this.room.id,
          playerId,
          msg.content,
          msg.zone as ChatScope,
          this.state
        )
        break
      case 'vote': {
        if (typeof msg.targetId !== 'string') return
        const { handleVote } = await import('./vote-manager')
        await handleVote(this.room, playerId, msg.targetId, this.room.id)
        break
      }
      case 'ready':
        await handleReady(
          this.room,
          this.room.id,
          playerId,
          typeof msg.displayName === 'string'
            ? sanitizeDisplayName(msg.displayName, this.state)
            : undefined,
          typeof msg.playerType === 'string' ? msg.playerType : undefined,
          typeof msg.customPrompt === 'string'
            ? (msg.customPrompt as string).slice(0, 2000)
            : undefined,
          this.state
        )
        break
    }
  }

  async onClose(conn: Party.Connection) {
    const playerId = this.state.connToPlayer.get(conn.id) ?? conn.id
    this.state.connToPlayer.delete(conn.id)

    const timer = this.state.zoneWriteDebounce.get(playerId)
    if (timer) clearTimeout(timer)
    this.state.zoneWriteDebounce.delete(playerId)

    if (this.state.currentPhase === 'lobby') {
      this.state.positions.delete(playerId)
      this.state.zones.delete(playerId)
      this.room.broadcast(JSON.stringify({ type: 'player_left', playerId }))
    } else {
      // Fire-and-forget — don't block onClose with Redis calls
      import('../../lib/game/room-store')
        .then(({ roomStore }) =>
          roomStore.update(this.room.id, (r) => {
            const player = r.players.get(playerId)
            if (player) player.isConnected = false
            return r
          })
        )
        .catch(() => {})
    }
  }

  async onAlarm() {
    const alarmType = await this.room.storage.get<string>('currentAlarm')

    if (alarmType === ALARM_ROUND_END) {
      await endRound(this.room, this.room.id, this.state)
    } else if (alarmType === ALARM_VOTE_END) {
      const { handleVote } = await import('./vote-manager')
      await handleVote(this.room, null, null, this.room.id)
    } else if (alarmType === ALARM_START_ROUND) {
      const nextRound =
        (await this.room.storage.get<number>('nextRoundNumber')) ?? 1
      await startRound(this.room, this.room.id, nextRound, this.state)
    }
  }
}
