import type * as Party from 'partykit/server'
import type { Room, Player, ZoneType, ChatMessage } from '../../lib/game/types'
import { buildChatPrompt } from '../../lib/game/prompt-builder'
import { streamAtHumanPace } from '../../lib/game/typing-simulator'
import { generateAgentResponse } from '../../lib/game/model-registry'
import { TYPING_PROFILES } from '../../lib/game/agent-personas'
import {
  AGENT_STAGGER_BASE_MS,
  AGENT_STAGGER_MAX_MS,
  AGENT_RESPONSE_PROBABILITY,
  AGENT_CONTEXT_MESSAGES,
  MAX_CHAT_HISTORY_PER_ZONE,
} from '../../lib/game/constants'

export function triggerAgentResponses(
  room: Room,
  zone: ZoneType,
  playersInZone: string[],
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>
) {
  // Find agents in this zone
  const agentsInZone = playersInZone
    .map((id) => room.players.get(id))
    .filter(
      (p): p is Player =>
        p != null &&
        (p.type === 'auto-agent' || p.type === 'custom-agent') &&
        !p.isEliminated
    )

  for (const agent of agentsInZone) {
    // Each agent has AGENT_RESPONSE_PROBABILITY chance to respond
    if (Math.random() > AGENT_RESPONSE_PROBABILITY) continue

    // Stagger responses
    const staggerDelay =
      AGENT_STAGGER_BASE_MS +
      Math.random() * (AGENT_STAGGER_MAX_MS - AGENT_STAGGER_BASE_MS)

    setTimeout(() => {
      respondAsAgent(room, agent, zone, partyRoom, connToPlayer).catch(() => {
        // Agent response failure is non-critical
      })
    }, staggerDelay)
  }
}

async function respondAsAgent(
  room: Room,
  agent: Player,
  zone: ZoneType,
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>
) {
  // Build prompt
  const systemPrompt = buildChatPrompt(agent, room)

  // Get recent zone history as conversation context
  const zoneHistory = agent.chatHistory.find((h) => h.zone === zone)
  const recentMessages = (zoneHistory?.messages ?? [])
    .slice(-AGENT_CONTEXT_MESSAGES)
    .map((m) => ({
      role: (m.playerId === agent.id ? 'assistant' : 'user') as
        | 'user'
        | 'assistant',
      content: `${m.displayName}: ${m.content}`,
    }))

  // Generate full response silently (not streamed to client yet)
  const fullResponse = await generateAgentResponse(systemPrompt, recentMessages)

  if (!fullResponse.trim()) return

  // Get typing profile
  const profile = TYPING_PROFILES[agent.id] ?? TYPING_PROFILES['default']

  // Create message ID for streaming updates
  const messageId = crypto.randomUUID()

  // Broadcast typing indicator ON
  broadcastToZone(
    partyRoom,
    connToPlayer,
    zone,
    room,
    JSON.stringify({
      type: 'agent_typing',
      playerId: agent.id,
      zone,
      isTyping: true,
    })
  )

  // Stream at human pace
  let accumulated = ''
  await streamAtHumanPace(
    fullResponse,
    profile,
    () => {
      // onTypingStart — already broadcasting typing indicator
    },
    (char: string) => {
      accumulated += char
      // Broadcast streaming message update
      const streamMsg: ChatMessage = {
        id: messageId,
        playerId: agent.id,
        displayName: agent.displayName,
        content: accumulated,
        zone,
        timestamp: Date.now(),
        isStreaming: true,
      }
      broadcastToZone(
        partyRoom,
        connToPlayer,
        zone,
        room,
        JSON.stringify({ type: 'chat_message', message: streamMsg })
      )
    },
    () => {
      // onTypingEnd — send final message
      const finalMsg: ChatMessage = {
        id: messageId,
        playerId: agent.id,
        displayName: agent.displayName,
        content: fullResponse,
        zone,
        timestamp: Date.now(),
        isStreaming: false,
      }
      broadcastToZone(
        partyRoom,
        connToPlayer,
        zone,
        room,
        JSON.stringify({ type: 'chat_message', message: finalMsg })
      )

      // Typing indicator OFF
      broadcastToZone(
        partyRoom,
        connToPlayer,
        zone,
        room,
        JSON.stringify({
          type: 'agent_typing',
          playerId: agent.id,
          zone,
          isTyping: false,
        })
      )
    }
  )

  // Persist final message to agent's own chat history
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    await roomStore.update(partyRoom.id, (r) => {
      const agentPlayer = r.players.get(agent.id)
      if (!agentPlayer) return r

      let entry = agentPlayer.chatHistory.find(
        (e: { zone: string }) => e.zone === zone
      )
      if (!entry) {
        entry = { zone, messages: [] }
        agentPlayer.chatHistory.push(entry)
      }
      entry.messages.push({
        id: messageId,
        playerId: agent.id,
        displayName: agent.displayName,
        content: fullResponse,
        zone,
        timestamp: Date.now(),
      })
      if (entry.messages.length > MAX_CHAT_HISTORY_PER_ZONE) {
        entry.messages = entry.messages.slice(-MAX_CHAT_HISTORY_PER_ZONE)
      }
      return r
    })
  } catch {
    // Non-critical
  }
}

function broadcastToZone(
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  zone: ZoneType,
  room: Room,
  payload: string
) {
  for (const [connId, playerId] of connToPlayer) {
    const player = room.players.get(playerId)
    if (player && player.currentZone === zone) {
      const conn = partyRoom.getConnection(connId)
      if (conn) conn.send(payload)
    }
  }
}

export async function generateAgentVote(
  agent: Player,
  room: Room,
  candidates: Player[]
): Promise<string | null> {
  const { buildVotePrompt } = await import('../../lib/game/prompt-builder')
  const votePrompt = buildVotePrompt(agent, room, candidates)

  const response = await generateAgentResponse(votePrompt, [])

  // Match response to a candidate display name
  const trimmed = response.trim()
  const match = candidates.find(
    (c) => c.displayName.toLowerCase() === trimmed.toLowerCase()
  )

  return match?.id ?? null
}
