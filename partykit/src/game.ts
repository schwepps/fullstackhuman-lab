import type * as Party from 'partykit/server'
import type {
  ChatMessage,
  Player,
  Position,
  ZoneType,
  ChatScope,
  PublicPlayer,
  GamePhase,
} from '../../lib/game/types'
import {
  AVATAR_COLORS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ZONE_DEBOUNCE_MS,
  MAX_MESSAGE_LENGTH,
  MAX_CHAT_HISTORY_PER_ZONE,
  MAX_MESSAGES_PER_MINUTE,
  VOTE_TIMEOUT_MS,
  ALARM_ROUND_END,
  ALARM_VOTE_END,
  ALARM_START_ROUND,
} from '../../lib/game/constants'
import { computeZone, getPlayersInZone } from './proximity-router'
import { ZONES } from '../../lib/game/zones'
import { getNextTopic } from './topic-engine'
import { PERSONAS } from '../../lib/game/agent-personas'

const MIN_PLAYERS = 3

export default class GameRoom implements Party.Server {
  // In-memory only — ephemeral, high-frequency, never persisted directly
  positions: Map<string, Position> = new Map()
  zones: Map<string, ZoneType> = new Map()

  // Reconnection: maps conn.id → playerId (diverge after a reconnect)
  connToPlayer: Map<string, string> = new Map()

  // Debounce zone-change Redis writes
  zoneWriteDebounce: Map<string, ReturnType<typeof setTimeout>> = new Map()

  // Track assigned colors to prevent duplicates (also maps playerId → color)
  assignedColors: Set<number> = new Set()
  playerColors: Map<string, number> = new Map()

  // Track display names for chat
  displayNames: Map<string, string> = new Map()

  // Session tokens for reconnection (playerId → token)
  sessionTokens: Map<string, string> = new Map()

  // Per-player chat rate limiting (playerId → timestamps[])
  chatTimestamps: Map<string, number[]> = new Map()

  // Track current phase in memory
  currentPhase: GamePhase = 'lobby'

  constructor(readonly room: Party.Room) {}

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url)
    const sessionToken = url.searchParams.get('sessionToken')
    const requestedPlayerId = url.searchParams.get('playerId')

    // Reconnection path
    if (requestedPlayerId && sessionToken) {
      const roomData = await this.getRoomData()

      // Room expired — close with 4004
      if (!roomData) {
        conn.close(4004, 'Room not found')
        return
      }

      const player = roomData.players.get(requestedPlayerId)

      // Valid session — restore player state
      if (player && player.sessionToken === sessionToken) {
        this.connToPlayer.set(conn.id, requestedPlayerId)
        this.positions.set(requestedPlayerId, player.position)
        this.zones.set(requestedPlayerId, player.currentZone)
        this.displayNames.set(requestedPlayerId, player.displayName)
        this.assignedColors.add(player.avatarColor)
        this.playerColors.set(requestedPlayerId, player.avatarColor)

        // Mark player as connected in Redis
        try {
          const { roomStore } = await import('../../lib/game/room-store')
          await roomStore.update(this.room.id, (r) => {
            const p = r.players.get(requestedPlayerId)
            if (p) p.isConnected = true
            return r
          })
        } catch {
          // Non-critical
        }

        // Send reconnected event with full state
        conn.send(
          JSON.stringify({
            type: 'reconnected',
            phase: this.currentPhase,
            round: roomData.round,
            topic: roomData.currentTopic,
            yourPlayerId: requestedPlayerId,
            yourColor: player.avatarColor,
            roundStartedAt: roomData.roundStartedAt,
          })
        )

        // Send all current positions
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

        // Broadcast reconnection to others
        this.room.broadcast(
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

    // Fresh join — assign color and session token
    const color =
      AVATAR_COLORS.find((c) => !this.assignedColors.has(c)) ?? AVATAR_COLORS[0]
    this.assignedColors.add(color)
    this.playerColors.set(conn.id, color)

    const newSessionToken = crypto.randomUUID()

    // Map conn.id to itself for fresh joins
    this.connToPlayer.set(conn.id, conn.id)

    // Store session token for later Redis persistence
    this.sessionTokens.set(conn.id, newSessionToken)

    conn.send(
      JSON.stringify({
        type: 'phase_change',
        phase: this.currentPhase,
        yourPlayerId: conn.id,
        yourColor: color,
        sessionToken: newSessionToken,
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

    // Send lobby sync — all existing players so the joiner sees the full roster
    const sentPlayerIds = new Set<string>()
    for (const [existingConnId, existingPlayerId] of this.connToPlayer) {
      if (existingConnId === conn.id) continue
      if (sentPlayerIds.has(existingPlayerId)) continue
      sentPlayerIds.add(existingPlayerId)
      conn.send(
        JSON.stringify({
          type: 'player_joined',
          player: {
            id: existingPlayerId,
            displayName:
              this.displayNames.get(existingPlayerId) ??
              existingPlayerId.slice(0, 6),
            avatarColor:
              this.playerColors.get(existingPlayerId) ?? AVATAR_COLORS[0],
            isConnected: true,
            isEliminated: false,
          },
        })
      )
    }

    // Persist player to Redis (create room if first player)
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      const existing = await roomStore.get(this.room.id)

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
        await roomStore.update(this.room.id, (r) => {
          r.players.set(conn.id, newPlayer)
          return r
        })
      } else {
        await roomStore.create({
          id: this.room.id,
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

  async onMessage(message: string, sender: Party.Connection) {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }

    // Always resolve playerId — conn.id diverges from playerId after reconnect
    const playerId = this.connToPlayer.get(sender.id) ?? sender.id

    // Validate message shape before processing
    if (typeof msg.type !== 'string') return

    switch (msg.type) {
      case 'move': {
        const pos = msg.position as { x?: unknown; y?: unknown } | undefined
        if (typeof pos?.x !== 'number' || typeof pos?.y !== 'number') return
        this.handleMove(playerId, pos as Position)
        break
      }
      case 'move-to': {
        const tgt = msg.target as { x?: unknown; y?: unknown } | undefined
        if (typeof tgt?.x !== 'number' || typeof tgt?.y !== 'number') return
        this.handleMove(playerId, tgt as Position)
        break
      }
      case 'chat':
        if (typeof msg.content !== 'string' || typeof msg.zone !== 'string')
          return
        await this.handleChat(
          playerId,
          msg.content,
          msg.zone as ChatScope,
          sender
        )
        break
      case 'vote': {
        if (typeof msg.targetId !== 'string') return
        const { handleVote } = await import('./vote-manager')
        await handleVote(this.room, playerId, msg.targetId, this.room.id)
        break
      }
      case 'ready': {
        const readyName =
          typeof msg.displayName === 'string'
            ? msg.displayName.trim().slice(0, 16)
            : undefined
        const readyType =
          typeof msg.playerType === 'string' ? msg.playerType : undefined
        const readyPrompt =
          typeof msg.customPrompt === 'string' ? msg.customPrompt : undefined
        await this.handleReady(playerId, readyName, readyType, readyPrompt)
        break
      }
    }
  }

  async onClose(conn: Party.Connection) {
    const playerId = this.connToPlayer.get(conn.id) ?? conn.id
    this.connToPlayer.delete(conn.id)

    // Clean up debounce timer
    const timer = this.zoneWriteDebounce.get(playerId)
    if (timer) clearTimeout(timer)
    this.zoneWriteDebounce.delete(playerId)

    // During game (not lobby), keep position/zone for reconnection
    if (this.currentPhase === 'lobby') {
      this.positions.delete(playerId)
      this.zones.delete(playerId)
      this.room.broadcast(JSON.stringify({ type: 'player_left', playerId }))
    } else {
      // Mark as disconnected in Redis but preserve state
      try {
        const { roomStore } = await import('../../lib/game/room-store')
        await roomStore.update(this.room.id, (r) => {
          const player = r.players.get(playerId)
          if (player) player.isConnected = false
          return r
        })
      } catch {
        // Non-critical
      }
    }
  }

  // ─── onAlarm — the ONLY reliable timer in Cloudflare Workers ──────────────

  async onAlarm() {
    const alarmType = await this.room.storage.get<string>('currentAlarm')

    if (alarmType === ALARM_ROUND_END) {
      await this.endRound()
    } else if (alarmType === ALARM_VOTE_END) {
      const { handleVote } = await import('./vote-manager')
      await handleVote(this.room, null, null, this.room.id)
    } else if (alarmType === ALARM_START_ROUND) {
      const nextRound =
        (await this.room.storage.get<number>('nextRoundNumber')) ?? 1
      await this.startRound(nextRound)
    }
  }

  // ─── Movement ─────────────────────────────────────────────────────────────

  private handleMove(playerId: string, position: Position) {
    if (
      typeof position?.x !== 'number' ||
      typeof position?.y !== 'number' ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    ) {
      return
    }
    const clamped: Position = {
      x: Math.max(0, Math.min(CANVAS_WIDTH, position.x)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, position.y)),
    }
    this.positions.set(playerId, clamped)

    let newZone = computeZone(clamped)
    const prevZone = this.zones.get(playerId) ?? 'main'

    // Enforce zone capacity — reject entry to full private zones
    if (newZone !== prevZone && newZone !== 'main') {
      const zoneDef = ZONES.find((z) => z.id === newZone)
      if (zoneDef) {
        const occupants = getPlayersInZone(newZone, this.zones)
        if (occupants.length >= zoneDef.capacity) {
          newZone = prevZone // Stay in previous zone
        }
      }
    }
    this.zones.set(playerId, newZone)

    if (newZone !== prevZone) {
      this.room.broadcast(
        JSON.stringify({ type: 'zone_update', playerId, zone: newZone })
      )

      const existingTimer = this.zoneWriteDebounce.get(playerId)
      if (existingTimer) clearTimeout(existingTimer)

      this.zoneWriteDebounce.set(
        playerId,
        setTimeout(async () => {
          this.zoneWriteDebounce.delete(playerId)
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

  // ─── Chat ────────────────────────────────────────────────────────────────

  private async handleChat(
    playerId: string,
    content: string,
    _zone: ChatScope,
    _sender: Party.Connection
  ) {
    const trimmed = content.trim()
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return

    // Per-player rate limiting
    const now = Date.now()
    const timestamps = this.chatTimestamps.get(playerId) ?? []
    const recent = timestamps.filter((t) => now - t < 60_000)
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) return
    recent.push(now)
    this.chatTimestamps.set(playerId, recent)

    const senderZone = this.zones.get(playerId) ?? 'main'

    const chatMsg: ChatMessage = {
      id: crypto.randomUUID(),
      playerId,
      displayName: this.displayNames.get(playerId) ?? playerId.slice(0, 6),
      content: trimmed,
      zone: senderZone,
      timestamp: Date.now(),
    }

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

    // Optimistic delivery — moderate async (never blocks message flow)
    this.moderateAsync(chatMsg.id, trimmed, playerId, senderZone, playersInZone)

    // Persist and trigger agents
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      const updatedRoom = await roomStore.update(this.room.id, (r) => {
        for (const pId of playersInZone) {
          const player = r.players.get(pId)
          if (!player) continue

          let entry = player.chatHistory.find(
            (e: { zone: string }) => e.zone === senderZone
          )
          if (!entry) {
            entry = { zone: senderZone, messages: [] }
            player.chatHistory.push(entry)
          }
          entry.messages.push(chatMsg)

          if (entry.messages.length > MAX_CHAT_HISTORY_PER_ZONE) {
            entry.messages = entry.messages.slice(-MAX_CHAT_HISTORY_PER_ZONE)
          }
        }
        return r
      })

      // Trigger agent responses if sender is human
      const senderPlayer = updatedRoom.players.get(playerId)
      if (senderPlayer?.type === 'human') {
        const { triggerAgentResponses } = await import('./agent-manager')
        triggerAgentResponses(
          updatedRoom,
          senderZone,
          playersInZone,
          this.room,
          this.connToPlayer,
          this.zones
        )
      }
    } catch {
      // Room may not exist yet
    }
  }

  // ─── Moderation (fire-and-forget) ─────────────────────────────────────

  private moderateAsync(
    messageId: string,
    content: string,
    playerId: string,
    zone: ZoneType,
    playersInZone: string[]
  ) {
    const baseUrl = process.env.NEXTJS_URL ?? 'http://localhost:3000'
    const internalToken = process.env.GAME_INTERNAL_TOKEN ?? ''

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (internalToken) headers['x-internal-token'] = internalToken

    fetch(`${baseUrl}/api/game/moderate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, playerId }),
    })
      .then((res) => res.json() as Promise<{ safe: boolean; reason?: string }>)
      .then((result) => {
        if (!result.safe) {
          const removePayload = JSON.stringify({
            type: 'message_removed',
            messageId,
            reason: result.reason ?? 'moderated',
          })
          for (const [connId, pId] of this.connToPlayer) {
            if (playersInZone.includes(pId)) {
              const conn = this.room.getConnection(connId)
              if (conn) conn.send(removePayload)
            }
          }
        }
      })
      .catch(() => {
        // Fail closed — moderation service down, remove message
        const removePayload = JSON.stringify({
          type: 'message_removed',
          messageId,
          reason: 'moderation_unavailable',
        })
        for (const [connId, pId] of this.connToPlayer) {
          if (playersInZone.includes(pId)) {
            const conn = this.room.getConnection(connId)
            if (conn) conn.send(removePayload)
          }
        }
      })
  }

  // ─── Ready / Round lifecycle ────────────────────────────────────────────

  private async handleReady(
    playerId: string,
    displayName?: string,
    playerType?: string,
    customPrompt?: string
  ) {
    if (this.currentPhase !== 'lobby') return

    // Apply display name if provided
    if (displayName) {
      this.displayNames.set(playerId, displayName)
    }

    // Update player in Redis with lobby choices
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      await roomStore.update(this.room.id, (r) => {
        const player = r.players.get(playerId)
        if (!player) return r
        if (displayName) player.displayName = displayName
        if (
          playerType === 'human' ||
          playerType === 'custom-agent' ||
          playerType === 'spectator'
        ) {
          player.type = playerType
        }
        if (playerType === 'custom-agent' && customPrompt) {
          player.customPrompt = customPrompt
        }
        return r
      })
    } catch {
      // Non-critical
    }

    // Only host can start
    // For now, the first connected player is host
    const firstPlayer = this.connToPlayer.values().next().value
    if (playerId !== firstPlayer) return

    // Need minimum players (count unique player IDs, not connections)
    const uniquePlayers = new Set(this.connToPlayer.values())
    if (uniquePlayers.size < MIN_PLAYERS) return

    // Fill empty slots with auto-agents (up to reasonable total)
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      await roomStore.update(this.room.id, (r) => {
        const humanCount = r.players.size
        const agentsNeeded = Math.max(0, MIN_PLAYERS - humanCount)
        const availablePersonas = PERSONAS.filter((p) => !r.players.has(p.id))

        for (let i = 0; i < agentsNeeded && i < availablePersonas.length; i++) {
          const persona = availablePersonas[i]
          const color =
            AVATAR_COLORS.find((c) => !this.assignedColors.has(c)) ??
            AVATAR_COLORS[0]
          this.assignedColors.add(color)

          const agentPlayer: Player = {
            id: persona.id,
            displayName: persona.name,
            type: 'auto-agent',
            model: 'claude-sonnet-4-6',
            revealPreference: 'public',
            position: {
              x: 400 + Math.random() * 400,
              y: 250 + Math.random() * 300,
            },
            currentZone: 'main',
            avatarColor: color,
            isConnected: true,
            isEliminated: false,
            score: 0,
            roundsSurvived: 0,
            correctVotes: 0,
            sessionToken: crypto.randomUUID(),
            chatHistory: [],
          }
          r.players.set(persona.id, agentPlayer)

          // Track in memory
          this.displayNames.set(persona.id, persona.name)
          this.zones.set(persona.id, 'main')
          this.positions.set(persona.id, agentPlayer.position)

          // Broadcast agent joining
          this.room.broadcast(
            JSON.stringify({
              type: 'player_joined',
              player: {
                id: persona.id,
                displayName: persona.name,
                avatarColor: color,
                isConnected: true,
                isEliminated: false,
                position: agentPlayer.position,
              },
            })
          )
        }
        return r
      })
    } catch {
      // Room may not exist yet, create it in startRound
    }

    await this.startRound(1)
  }

  private async startRound(roundNumber: number) {
    const topic = getNextTopic(roundNumber)
    const roundStartedAt = Date.now()
    this.currentPhase = 'round'

    try {
      const { roomStore } = await import('../../lib/game/room-store')
      await roomStore.update(this.room.id, (r) => {
        r.phase = 'round'
        r.round = roundNumber
        r.currentTopic = topic
        r.votes = new Map()
        r.roundStartedAt = roundStartedAt
        return r
      })
    } catch {
      // Non-critical
    }

    // Broadcast phase change
    this.room.broadcast(
      JSON.stringify({
        type: 'phase_change',
        phase: 'round',
        round: roundNumber,
        topic,
        roundStartedAt,
      })
    )

    // Set alarm for round end
    const roomData = await this.getRoomData()
    const duration = (roomData?.roundDuration ?? 180) * 1000
    await this.room.storage.put('currentAlarm', ALARM_ROUND_END)
    await this.room.storage.setAlarm(Date.now() + duration)
  }

  private async endRound() {
    this.currentPhase = 'vote'

    try {
      const { roomStore } = await import('../../lib/game/room-store')
      await roomStore.update(this.room.id, (r) => {
        r.phase = 'vote'
        return r
      })
    } catch {
      // Non-critical
    }

    this.room.broadcast(JSON.stringify({ type: 'phase_change', phase: 'vote' }))

    // Set alarm for vote timeout
    await this.room.storage.put('currentAlarm', ALARM_VOTE_END)
    await this.room.storage.setAlarm(Date.now() + VOTE_TIMEOUT_MS)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getRoomData() {
    try {
      const { roomStore } = await import('../../lib/game/room-store')
      return await roomStore.get(this.room.id)
    } catch {
      return null
    }
  }
}
