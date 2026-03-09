import type * as Party from 'partykit/server'
import type {
  Room,
  Player,
  ZoneType,
  ChatMessage,
  TypingProfile,
} from '../../lib/game/types'
import { isAgentType } from '../../lib/game/types'
import {
  buildChatPrompt,
  buildInitiativePrompt,
} from '../../lib/game/prompt-builder'
import type { InitiativeTrigger } from '../../lib/game/prompt-builder'
import { streamAtHumanPace } from '../../lib/game/typing-simulator'
import { generateAgentResponse } from '../../lib/game/model-registry'
import { TYPING_PROFILES, PERSONAS } from '../../lib/game/agent-personas'
import { humanizeText } from '../../lib/game/text-humanizer'
import {
  AGENT_STAGGER_BASE_MS,
  AGENT_STAGGER_MAX_MS,
  AGENT_RESPONSE_PROBABILITY,
  AGENT_CONTEXT_MESSAGES,
  FALLBACK_NAME_LENGTH,
} from '../../lib/game/constants'
import { appendToChatHistory } from './chat-persistence'
import type { GameState } from './game-state'
import { getPlayersInZone } from './proximity-router'

export async function triggerAgentResponses(
  room: Room,
  zone: ZoneType,
  playersInZone: string[],
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  liveZones?: Map<string, ZoneType>,
  responseProbability = AGENT_RESPONSE_PROBABILITY,
  staggerBase = AGENT_STAGGER_BASE_MS,
  staggerMax = AGENT_STAGGER_MAX_MS
) {
  // Per-zone cooldown to prevent overlapping agent response batches
  try {
    const { checkAgentCooldown } = await import('../../lib/game/rate-limiter')
    const allowed = await checkAgentCooldown(partyRoom.id, zone)
    if (!allowed) return
  } catch {
    // Rate limiter unavailable — proceed without cooldown
  }

  // Find agents in this zone
  const agentsInZone = playersInZone
    .map((id) => room.players.get(id))
    .filter(
      (p): p is Player => p != null && isAgentType(p.type) && !p.isEliminated
    )

  for (const agent of agentsInZone) {
    if (Math.random() > responseProbability) continue

    const staggerDelay =
      staggerBase + Math.random() * (staggerMax - staggerBase)

    setTimeout(() => {
      respondAsAgent(
        room,
        agent,
        zone,
        partyRoom,
        connToPlayer,
        liveZones
      ).catch((e) => {
        console.error('[triggerAgentResponses] Agent response failed:', e)
      })
    }, staggerDelay)
  }
}

async function respondAsAgent(
  room: Room,
  agent: Player,
  zone: ZoneType,
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  liveZones?: Map<string, ZoneType>
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
  const rawResponse = await generateAgentResponse(systemPrompt, recentMessages)
  if (!rawResponse.trim()) return

  // Humanize: add typos, casual formatting, strip AI patterns
  const persona = PERSONAS.find((p) => p.id === agent.id)
  const fullResponse = persona
    ? humanizeText(rawResponse, persona)
    : rawResponse

  // Get typing profile
  const profile = TYPING_PROFILES[agent.id] ?? TYPING_PROFILES['default']

  // Reading delay — proportional to last message length
  const lastMsg = recentMessages[recentMessages.length - 1]
  if (lastMsg) {
    const readingDelay = Math.min(lastMsg.content.length * 30, 3000)
    await new Promise((r) => setTimeout(r, readingDelay))
  }

  // Create message ID for streaming updates
  const messageId = crypto.randomUUID()

  // False-start typing (15% chance) — simulates typing then deleting
  if (Math.random() < 0.15) {
    broadcastToZone(
      partyRoom,
      connToPlayer,
      zone,
      liveZones,
      JSON.stringify({
        type: 'agent_typing',
        playerId: agent.id,
        displayName: agent.displayName,
        zone,
        isTyping: true,
      })
    )
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))
    broadcastToZone(
      partyRoom,
      connToPlayer,
      zone,
      liveZones,
      JSON.stringify({
        type: 'agent_typing',
        playerId: agent.id,
        displayName: agent.displayName,
        zone,
        isTyping: false,
      })
    )
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000))
  }

  // Stream response at human pace with typing indicators
  await broadcastStreamedMessage({
    fullResponse,
    profile,
    agent,
    zone,
    messageId,
    partyRoom,
    connToPlayer,
    liveZones,
  })

  // Persist final message to agent's own chat history
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    const chatMsg: ChatMessage = {
      id: messageId,
      playerId: agent.id,
      displayName: agent.displayName,
      content: fullResponse,
      zone,
      timestamp: Date.now(),
    }
    await roomStore.update(partyRoom.id, (r) => {
      const agentPlayer = r.players.get(agent.id)
      if (agentPlayer) appendToChatHistory(agentPlayer, zone, chatMsg)
      return r
    })
  } catch (e) {
    console.error('[respondAsAgent] Redis chat history persist failed:', e)
  }
}

export async function initiateAgentChat(
  room: Room,
  agent: Player,
  zone: ZoneType,
  trigger: InitiativeTrigger,
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  liveZones: Map<string, ZoneType>,
  state: GameState
) {
  const playersInZone = getPlayersInZone(zone, liveZones)
  const playerNames = playersInZone
    .map(
      (id) => state.displayNames.get(id) ?? id.slice(0, FALLBACK_NAME_LENGTH)
    )
    .filter((n) => n !== agent.displayName)

  const zoneHistory = agent.chatHistory.find((h) => h.zone === zone)
  const recentMessages = (zoneHistory?.messages ?? []).slice(-5)

  const systemPrompt = buildInitiativePrompt(agent, room, trigger, {
    playersInZone: playerNames,
    recentMessages,
  })

  const rawResponse = await generateAgentResponse(systemPrompt, [])
  if (!rawResponse.trim()) return

  const persona = PERSONAS.find((p) => p.id === agent.id)
  const fullResponse = persona
    ? humanizeText(rawResponse, persona)
    : rawResponse

  const profile = TYPING_PROFILES[agent.id] ?? TYPING_PROFILES['default']
  const messageId = crypto.randomUUID()

  // Stream response at human pace with typing indicators
  await broadcastStreamedMessage({
    fullResponse,
    profile,
    agent,
    zone,
    messageId,
    partyRoom,
    connToPlayer,
    liveZones,
  })

  // Persist to chat history
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    const chatMsg: ChatMessage = {
      id: messageId,
      playerId: agent.id,
      displayName: agent.displayName,
      content: fullResponse,
      zone,
      timestamp: Date.now(),
    }
    await roomStore.update(partyRoom.id, (r) => {
      for (const pId of playersInZone) {
        const player = r.players.get(pId)
        if (player) appendToChatHistory(player, zone, chatMsg)
      }
      return r
    })
  } catch (e) {
    console.error('[initiateAgentChat] Redis chat history persist failed:', e)
  }
}

async function broadcastStreamedMessage(opts: {
  fullResponse: string
  profile: TypingProfile
  agent: Player
  zone: ZoneType
  messageId: string
  partyRoom: Party.Room
  connToPlayer: Map<string, string>
  liveZones?: Map<string, ZoneType>
}): Promise<void> {
  const {
    fullResponse,
    profile,
    agent,
    zone,
    messageId,
    partyRoom,
    connToPlayer,
    liveZones,
  } = opts

  // Typing indicator ON
  broadcastToZone(
    partyRoom,
    connToPlayer,
    zone,
    liveZones,
    JSON.stringify({
      type: 'agent_typing',
      playerId: agent.id,
      displayName: agent.displayName,
      zone,
      isTyping: true,
    })
  )

  // Stream at human pace
  let accumulated = ''
  await streamAtHumanPace(
    fullResponse,
    profile,
    () => {},
    (char: string) => {
      accumulated += char
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
        liveZones,
        JSON.stringify({ type: 'chat_message', message: streamMsg })
      )
    },
    () => {
      // Final message
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
        liveZones,
        JSON.stringify({ type: 'chat_message', message: finalMsg })
      )

      // Typing indicator OFF
      broadcastToZone(
        partyRoom,
        connToPlayer,
        zone,
        liveZones,
        JSON.stringify({
          type: 'agent_typing',
          playerId: agent.id,
          displayName: agent.displayName,
          zone,
          isTyping: false,
        })
      )
    }
  )
}

function broadcastToZone(
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  zone: ZoneType,
  liveZones: Map<string, ZoneType> | undefined,
  payload: string
) {
  for (const [connId, playerId] of connToPlayer) {
    // Use live zones map (real-time) if available, otherwise skip
    const playerZone = liveZones?.get(playerId)
    if (playerZone === zone) {
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
