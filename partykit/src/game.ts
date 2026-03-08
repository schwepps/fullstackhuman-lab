import type * as Party from 'partykit/server'
import type {
  ClientMessage,
  ChatMessage,
  Position,
  ZoneType,
  ChatScope,
  PublicPlayer,
} from '../../lib/game/types'
import {
  AVATAR_COLORS,
  ZONE_DEBOUNCE_MS,
  MAX_MESSAGE_LENGTH,
  MAX_CHAT_HISTORY_PER_ZONE,
} from '../../lib/game/constants'
import { computeZone, getPlayersInZone } from './proximity-router'

// Alarm key constants — stored in Partykit storage
const ALARM_ROUND_END = 'alarm:roundEnd'
const ALARM_VOTE_END = 'alarm:voteEnd'
const ALARM_START_ROUND = 'alarm:startRound'

export default class GameRoom implements Party.Server {
  // In-memory only — ephemeral, high-frequency, never persisted directly
  positions: Map<string, Position> = new Map()
  zones: Map<string, ZoneType> = new Map()

  // Reconnection: maps conn.id → playerId (diverge after a reconnect)
  connToPlayer: Map<string, string> = new Map()

  // Debounce zone-change Redis writes
  zoneWriteDebounce: Map<string, ReturnType<typeof setTimeout>> = new Map()

  // Track assigned colors to prevent duplicates
  assignedColors: Set<number> = new Set()

  // Track display names for chat
  displayNames: Map<string, string> = new Map()

  constructor(readonly room: Party.Room) {}

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url)
    const sessionToken = url.searchParams.get('sessionToken')
    const requestedPlayerId = url.searchParams.get('playerId')

    // TODO Phase 9+: load room from roomStore, handle reconnection
    // For now, send a basic connection acknowledgment

    // Reconnection path (stub — will be implemented in Phase 11)
    if (requestedPlayerId && sessionToken) {
      this.connToPlayer.set(conn.id, requestedPlayerId)
      conn.send(
        JSON.stringify({
          type: 'phase_change',
          phase: 'lobby',
          yourPlayerId: requestedPlayerId,
        })
      )
      return
    }

    // Fresh join — assign color
    const color =
      AVATAR_COLORS.find((c) => !this.assignedColors.has(c)) ?? AVATAR_COLORS[0]
    this.assignedColors.add(color)

    // Map conn.id to itself for fresh joins
    this.connToPlayer.set(conn.id, conn.id)

    conn.send(
      JSON.stringify({
        type: 'phase_change',
        phase: 'lobby',
        yourPlayerId: conn.id,
        yourColor: color,
      })
    )

    // Broadcast to others
    const publicPlayer: Partial<PublicPlayer> = {
      id: conn.id,
      avatarColor: color,
      isConnected: true,
      isEliminated: false,
    }
    this.room.broadcast(
      JSON.stringify({ type: 'player_joined', player: publicPlayer }),
      [conn.id]
    )

    // Send current positions to new joiner
    const posUpdates = Array.from(this.positions.entries()).map(
      ([id, pos]) => ({
        playerId: id,
        position: pos,
        zone: this.zones.get(id) ?? 'main',
      })
    )
    if (posUpdates.length) {
      conn.send(
        JSON.stringify({ type: 'position_update', updates: posUpdates })
      )
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }

    // Always resolve playerId — conn.id diverges from playerId after reconnect
    const playerId = this.connToPlayer.get(sender.id) ?? sender.id

    switch (msg.type) {
      case 'move':
        this.handleMove(playerId, msg.position)
        break
      case 'move-to':
        // move-to is handled client-side (interpolation) — server treats as position update
        this.handleMove(playerId, msg.target)
        break
      case 'chat':
        await this.handleChat(playerId, msg.content, msg.zone, sender)
        break
      case 'vote':
        // Stub — implemented in Phase 10
        break
      case 'ready':
        // Stub — implemented in Phase 9
        break
    }
  }

  async onClose(conn: Party.Connection) {
    const playerId = this.connToPlayer.get(conn.id) ?? conn.id
    this.connToPlayer.delete(conn.id)
    this.positions.delete(playerId)
    this.zones.delete(playerId)

    // Clean up debounce timer
    const timer = this.zoneWriteDebounce.get(playerId)
    if (timer) clearTimeout(timer)
    this.zoneWriteDebounce.delete(playerId)

    // Broadcast disconnection
    this.room.broadcast(JSON.stringify({ type: 'player_left', playerId }))
  }

  // ─── onAlarm — the ONLY reliable timer in Cloudflare Workers ──────────────

  async onAlarm() {
    const alarmType = await this.room.storage.get<string>('currentAlarm')

    if (alarmType === ALARM_ROUND_END) {
      await this.endRound()
    } else if (alarmType === ALARM_VOTE_END) {
      // Stub — implemented in Phase 10
    } else if (alarmType === ALARM_START_ROUND) {
      // Stub — implemented in Phase 9
    }
  }

  // ─── Movement ─────────────────────────────────────────────────────────────

  private handleMove(playerId: string, position: Position) {
    this.positions.set(playerId, position)

    // Compute zone and detect changes
    const newZone = computeZone(position)
    const prevZone = this.zones.get(playerId) ?? 'main'
    this.zones.set(playerId, newZone)

    if (newZone !== prevZone) {
      // Broadcast zone change to all connections
      this.room.broadcast(
        JSON.stringify({ type: 'zone_update', playerId, zone: newZone })
      )

      // Debounce Redis write for zone persistence
      const existingTimer = this.zoneWriteDebounce.get(playerId)
      if (existingTimer) clearTimeout(existingTimer)

      this.zoneWriteDebounce.set(
        playerId,
        setTimeout(async () => {
          this.zoneWriteDebounce.delete(playerId)
          try {
            const { roomStore } = await import('../../lib/game/room-store')
            await roomStore.update(this.room.id, (room) => {
              const player = room.players.get(playerId)
              if (player) player.currentZone = newZone
              return room
            })
          } catch {
            // Room may not exist yet in early phases
          }
        }, ZONE_DEBOUNCE_MS)
      )
    }

    // Broadcast position to all other players
    this.room.broadcast(
      JSON.stringify({
        type: 'position_update',
        updates: [
          {
            playerId,
            position,
            zone: newZone,
          },
        ],
      }),
      [playerId]
    )
  }

  // ─── Chat ────────────────────────────────────────────────────────────────

  private async handleChat(
    playerId: string,
    content: string,
    _zone: ChatScope,
    _sender: Party.Connection
  ) {
    // Validate content
    const trimmed = content.trim()
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return

    // Use sender's zone, not the zone from the client message (prevent spoofing)
    const senderZone = this.zones.get(playerId) ?? 'main'

    const chatMsg: ChatMessage = {
      id: crypto.randomUUID(),
      playerId,
      displayName: this.displayNames.get(playerId) ?? playerId.slice(0, 6),
      content: trimmed,
      zone: senderZone,
      timestamp: Date.now(),
    }

    // Zone-scoped delivery: send to all players in the same zone
    const playersInZone = getPlayersInZone(senderZone, this.zones)
    const msgPayload = JSON.stringify({
      type: 'chat_message',
      message: chatMsg,
    })

    for (const [connId, pId] of this.connToPlayer) {
      if (playersInZone.includes(pId)) {
        const conn = this.room.getConnection(connId)
        if (conn) conn.send(msgPayload)
      }
    }

    // Persist to Redis (fire and forget)
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      await roomStore.update(this.room.id, (room) => {
        // Add message to all players in zone
        for (const pId of playersInZone) {
          const player = room.players.get(pId)
          if (!player) continue

          let entry = player.chatHistory.find(
            (e: { zone: string }) => e.zone === senderZone
          )
          if (!entry) {
            entry = { zone: senderZone, messages: [] }
            player.chatHistory.push(entry)
          }
          entry.messages.push(chatMsg)

          // Cap at MAX_CHAT_HISTORY_PER_ZONE
          if (entry.messages.length > MAX_CHAT_HISTORY_PER_ZONE) {
            entry.messages = entry.messages.slice(-MAX_CHAT_HISTORY_PER_ZONE)
          }
        }
        return room
      })
      // Trigger agent responses if sender is human
      const senderPlayer = room.players.get(playerId)
      if (senderPlayer?.type === 'human') {
        const { triggerAgentResponses } = await import('./agent-manager')
        triggerAgentResponses(
          room,
          senderZone,
          playersInZone,
          this.room,
          this.connToPlayer
        )
      }
    } catch {
      // Room may not exist yet in early phases
    }
  }

  // ─── Phase transition stubs ───────────────────────────────────────────────

  private async endRound() {
    // Stub — implemented in Phase 9/10
    this.room.broadcast(JSON.stringify({ type: 'phase_change', phase: 'vote' }))
  }
}
