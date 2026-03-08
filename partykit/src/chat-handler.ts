import type * as Party from 'partykit/server'
import type { ChatMessage, ChatScope, ZoneType } from '../../lib/game/types'
import {
  MAX_MESSAGE_LENGTH,
  MAX_CHAT_HISTORY_PER_ZONE,
  MAX_MESSAGES_PER_MINUTE,
} from '../../lib/game/constants'
import { getPlayersInZone } from './proximity-router'
import type { GameState } from './game-state'

export async function handleChat(
  partyRoom: Party.Room,
  roomId: string,
  playerId: string,
  content: string,
  _zone: ChatScope,
  state: GameState
) {
  const trimmed = content.trim()
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return

  // Per-player rate limiting
  const now = Date.now()
  const timestamps = state.chatTimestamps.get(playerId) ?? []
  const recent = timestamps.filter((t) => now - t < 60_000)
  if (recent.length >= MAX_MESSAGES_PER_MINUTE) return
  recent.push(now)
  state.chatTimestamps.set(playerId, recent)

  const senderZone = state.zones.get(playerId) ?? 'main'

  const chatMsg: ChatMessage = {
    id: crypto.randomUUID(),
    playerId,
    displayName: state.displayNames.get(playerId) ?? playerId.slice(0, 6),
    content: trimmed,
    zone: senderZone,
    timestamp: Date.now(),
  }

  const playersInZone = getPlayersInZone(senderZone, state.zones)
  const msgPayload = JSON.stringify({ type: 'chat_message', message: chatMsg })

  for (const [connId, pId] of state.connToPlayer) {
    if (playersInZone.includes(pId)) {
      const conn = partyRoom.getConnection(connId)
      if (conn) conn.send(msgPayload)
    }
  }

  // Optimistic delivery — moderate async (never blocks message flow)
  moderateAsync(
    partyRoom,
    chatMsg.id,
    trimmed,
    playerId,
    senderZone,
    playersInZone,
    state
  )

  // Persist and trigger agents
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    const updatedRoom = await roomStore.update(roomId, (r) => {
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
        partyRoom,
        state.connToPlayer,
        state.zones
      )
    }
  } catch {
    // Room may not exist yet
  }
}

function moderateAsync(
  partyRoom: Party.Room,
  messageId: string,
  content: string,
  playerId: string,
  _zone: ZoneType,
  playersInZone: string[],
  state: GameState
) {
  const baseUrl = process.env.NEXTJS_URL ?? 'http://localhost:3000'
  const internalToken = process.env.GAME_INTERNAL_TOKEN ?? ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (internalToken) headers['x-internal-token'] = internalToken

  fetch(`${baseUrl}/api/game/moderate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, playerId }),
  })
    .then((res) => res.json() as Promise<{ safe: boolean; reason?: string }>)
    .then((result) => {
      if (!result.safe) {
        broadcastMessageRemoved(
          partyRoom,
          messageId,
          result.reason ?? 'moderated',
          playersInZone,
          state
        )
      }
    })
    .catch(() => {
      // Fail open — moderation service unavailable, keep message delivered
      // Messages are already validated (trimmed, length-checked, rate-limited)
    })
}

function broadcastMessageRemoved(
  partyRoom: Party.Room,
  messageId: string,
  reason: string,
  playersInZone: string[],
  state: GameState
) {
  const payload = JSON.stringify({ type: 'message_removed', messageId, reason })
  for (const [connId, pId] of state.connToPlayer) {
    if (playersInZone.includes(pId)) {
      const conn = partyRoom.getConnection(connId)
      if (conn) conn.send(payload)
    }
  }
}
