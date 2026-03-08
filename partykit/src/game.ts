import type * as Party from 'partykit/server'
import type { Position, ChatScope, GamePhase } from '../../lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ZONE_DEBOUNCE_MS,
  ALARM_ROUND_END,
  ALARM_VOTE_END,
  ALARM_START_ROUND,
} from '../../lib/game/constants'
import { computeZone, getPlayersInZone } from './proximity-router'
import { ZONES } from '../../lib/game/zones'
import type { GameState } from './game-state'
import { handleConnect } from './connection-handler'
import { handleChat } from './chat-handler'
import { handleReady, startRound, endRound } from './lobby-handler'

export default class GameRoom implements Party.Server {
  state: GameState = {
    currentPhase: 'lobby' as GamePhase,
    positions: new Map(),
    zones: new Map(),
    connToPlayer: new Map(),
    zoneWriteDebounce: new Map(),
    assignedColors: new Set(),
    playerColors: new Map(),
    displayNames: new Map(),
    sessionTokens: new Map(),
    chatTimestamps: new Map(),
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
        this.handleMove(playerId, pos as Position)
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
            ? msg.displayName.trim().slice(0, 16)
            : undefined,
          typeof msg.playerType === 'string' ? msg.playerType : undefined,
          typeof msg.customPrompt === 'string' ? msg.customPrompt : undefined,
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
      try {
        const { roomStore } = await import('../../lib/game/room-store')
        await roomStore.update(this.room.id, (r) => {
          const player = r.players.get(playerId)
          if (player) player.isConnected = false
          return r
        })
      } catch {}
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

  private handleMove(playerId: string, position: Position) {
    if (
      typeof position?.x !== 'number' ||
      typeof position?.y !== 'number' ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    )
      return

    const clamped: Position = {
      x: Math.max(0, Math.min(CANVAS_WIDTH, position.x)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, position.y)),
    }
    this.state.positions.set(playerId, clamped)

    let newZone = computeZone(clamped)
    const prevZone = this.state.zones.get(playerId) ?? 'main'

    if (newZone !== prevZone && newZone !== 'main') {
      const zoneDef = ZONES.find((z) => z.id === newZone)
      if (zoneDef) {
        const occupants = getPlayersInZone(newZone, this.state.zones)
        if (occupants.length >= zoneDef.capacity) {
          newZone = prevZone
        }
      }
    }
    this.state.zones.set(playerId, newZone)

    if (newZone !== prevZone) {
      this.room.broadcast(
        JSON.stringify({ type: 'zone_update', playerId, zone: newZone })
      )

      const existingTimer = this.state.zoneWriteDebounce.get(playerId)
      if (existingTimer) clearTimeout(existingTimer)

      this.state.zoneWriteDebounce.set(
        playerId,
        setTimeout(async () => {
          this.state.zoneWriteDebounce.delete(playerId)
          try {
            const { roomStore } = await import('../../lib/game/room-store')
            await roomStore.update(this.room.id, (r) => {
              const player = r.players.get(playerId)
              if (player) player.currentZone = newZone
              return r
            })
          } catch {
            // Room may not exist yet
          }
        }, ZONE_DEBOUNCE_MS)
      )
    }

    this.room.broadcast(
      JSON.stringify({
        type: 'position_update',
        updates: [{ playerId, position: clamped, zone: newZone }],
      }),
      [playerId]
    )
  }
}
