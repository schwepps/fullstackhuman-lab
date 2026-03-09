import type * as Party from 'partykit/server'
import type { ChatMessage, ChatScope, ZoneType } from '../../lib/game/types'
import { isAgentType } from '../../lib/game/types'
import {
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_PER_MINUTE,
  MAX_CONSECUTIVE_AGENT_MSGS,
  AGENT_TO_AGENT_PROBABILITY,
  AGENT_TO_AGENT_STAGGER_BASE_MS,
  AGENT_TO_AGENT_STAGGER_MAX_MS,
  FALLBACK_NAME_LENGTH,
} from '../../lib/game/constants'
import { getPlayersInZone } from './proximity-router'
import { appendToChatHistory } from './chat-persistence'
import type { GameState } from './game-state'

/** Encode HTML special chars for defense-in-depth XSS prevention */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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
    displayName: escapeHtml(
      state.displayNames.get(playerId) ??
        playerId.slice(0, FALLBACK_NAME_LENGTH)
    ),
    content: escapeHtml(trimmed),
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
        if (player) appendToChatHistory(player, senderZone, chatMsg)
      }
      return r
    })

    // Trigger agent responses — both from human and agent senders
    const senderPlayer = updatedRoom.players.get(playerId)
    const senderIsAgent = senderPlayer ? isAgentType(senderPlayer.type) : false

    if (senderIsAgent) {
      // Track consecutive agent messages per zone
      const count = (state.zoneAgentMsgCount.get(senderZone) ?? 0) + 1
      state.zoneAgentMsgCount.set(senderZone, count)

      // Allow agent-to-agent with lower probability and longer delay
      if (count < MAX_CONSECUTIVE_AGENT_MSGS) {
        const { triggerAgentResponses } = await import('./agent-manager')
        triggerAgentResponses(
          updatedRoom,
          senderZone,
          playersInZone,
          partyRoom,
          state.connToPlayer,
          state.zones,
          AGENT_TO_AGENT_PROBABILITY,
          AGENT_TO_AGENT_STAGGER_BASE_MS,
          AGENT_TO_AGENT_STAGGER_MAX_MS
        )
      }
    } else {
      // Human sender — reset consecutive counter, trigger with normal probability
      state.zoneAgentMsgCount.set(senderZone, 0)
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
  } catch (e) {
    console.error('[handleChat] Redis persist/agent trigger failed:', e)
  }
}

// Synchronous keyword blocklist — catches worst-case content even when moderation API is down
const BLOCKED_PATTERNS = [
  /\bn[i1]gg[aer]/i,
  /\bf[a@]gg?[o0]t/i,
  /\bk[i1]ke\b/i,
  /\btr[a@]nn[yi]/i,
  /\bch[i1]nk\b/i,
  /\bsp[i1]c\b/i,
  /\bw[e3]tb[a@]ck/i,
  /\bk[yi]s\b/i, // "kill yourself"
  /\bkill\s*your\s*self/i,
]

function matchesBlocklist(content: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(content))
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
  // Synchronous blocklist — immediate removal, no API call needed
  if (matchesBlocklist(content)) {
    broadcastMessageRemoved(
      partyRoom,
      messageId,
      'moderated',
      playersInZone,
      state
    )
    return
  }

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
    .catch((e) => {
      console.error('[moderateAsync] Moderation service unavailable:', e)
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
