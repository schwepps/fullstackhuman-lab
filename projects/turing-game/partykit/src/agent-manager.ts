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
import type {
  InitiativeTrigger,
  AgentMemoryContext,
} from '../../lib/game/prompt-builder'
import {
  calculateTypingDuration,
  calculateThinkingDuration,
  logNormalRandom,
} from '../../lib/game/typing-simulator'
import { generateAgentResponse } from '../../lib/game/model-registry'
import { TYPING_PROFILES, PERSONAS } from '../../lib/game/agent-personas'
import { humanizeText } from '../../lib/game/text-humanizer'
import {
  AGENT_STAGGER_BASE_MS,
  AGENT_STAGGER_MAX_MS,
  AGENT_RESPONSE_PROBABILITY,
  AGENT_CONTEXT_MESSAGES,
  AGENT_SELF_MEMORY_MAX,
  AGENT_CROSS_CONTEXT_MAX,
  FALLBACK_NAME_LENGTH,
  API_CALLS_PER_MINUTE_BUDGET,
  API_BUDGET_WINDOW_MS,
  MAX_TYPING_INDICATOR_MS,
  AGENT_FALSE_START_CHANCE,
  MAX_AGENT_RESPONDERS_PER_MESSAGE,
  AGENT_READING_MS_PER_CHAR,
  AGENT_READING_MAX_MS,
} from '../../lib/game/constants'
import { appendToChatHistory } from './chat-persistence'
import type { GameState } from './game-state'
import { getPlayersInZone } from './proximity-router'
import { getEmotionalPromptContext } from './agent-emotions'

/** Check and consume API budget. Returns true if call is allowed. Fails closed when state is unavailable. */
function consumeApiBudget(gameState?: GameState): boolean {
  if (!gameState) return false
  const now = Date.now()
  gameState.apiCallTimestamps = gameState.apiCallTimestamps.filter(
    (t) => now - t < API_BUDGET_WINDOW_MS
  )
  if (gameState.apiCallTimestamps.length >= API_CALLS_PER_MINUTE_BUDGET) {
    return false
  }
  gameState.apiCallTimestamps.push(now)
  return true
}

export type AgentResponseOpts = {
  responseProbability?: number
  staggerBase?: number
  staggerMax?: number
  gameState?: GameState
  roomId?: string
}

export async function triggerAgentResponses(
  room: Room,
  zone: ZoneType,
  playersInZone: string[],
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  liveZones?: Map<string, ZoneType>,
  opts: AgentResponseOpts = {}
) {
  const {
    responseProbability = AGENT_RESPONSE_PROBABILITY,
    staggerBase = AGENT_STAGGER_BASE_MS,
    staggerMax = AGENT_STAGGER_MAX_MS,
    gameState,
    roomId,
  } = opts

  const effectiveRoomId = roomId ?? partyRoom.id
  // Per-zone cooldown to prevent overlapping agent response batches
  try {
    const { checkAgentCooldown } = await import('../../lib/game/rate-limiter')
    const allowed = await checkAgentCooldown(effectiveRoomId, zone)
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

  // Selective responder: pick max N agents, weighted by who hasn't spoken recently
  const sorted = [...agentsInZone].sort((a, b) => {
    const aLast = gameState?.agentChatCooldowns.get(a.id) ?? 0
    const bLast = gameState?.agentChatCooldowns.get(b.id) ?? 0
    return aLast - bLast // least recently spoken first
  })
  const candidates = sorted.slice(0, MAX_AGENT_RESPONDERS_PER_MESSAGE)

  for (const agent of candidates) {
    if (Math.random() > responseProbability) continue

    // Log-normal stagger: most responses come quickly, occasional longer pauses
    const median = (staggerBase + staggerMax) / 2
    const staggerDelay = Math.max(
      staggerBase,
      Math.min(staggerMax * 1.5, logNormalRandom(median))
    )

    setTimeout(() => {
      respondAsAgent(
        room,
        agent,
        zone,
        partyRoom,
        connToPlayer,
        liveZones,
        gameState,
        effectiveRoomId
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
  liveZones?: Map<string, ZoneType>,
  gameState?: GameState,
  roomId?: string
) {
  // Board discovery delay: simulate noticing and reading the message
  const discoveryDelay = 1500 + Math.random() * 3000
  await new Promise((r) => setTimeout(r, discoveryDelay))

  // API budget check — skip if over budget
  if (!consumeApiBudget(gameState)) return

  // Build memory context from agent message log
  const memory = gameState
    ? buildAgentMemory(agent.id, zone, gameState)
    : undefined

  // Build prompt
  const systemPrompt = buildChatPrompt(agent, room, memory)

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

  // Log to agent message log for collective memory
  if (gameState) {
    appendToAgentLog(gameState, agent.id, fullResponse, zone)
  }

  // Get typing profile
  const profile = TYPING_PROFILES[agent.id] ?? TYPING_PROFILES['default']

  // Reading delay — proportional to last message length
  const lastMsg = recentMessages[recentMessages.length - 1]
  if (lastMsg) {
    const readingDelay = Math.min(
      lastMsg.content.length * AGENT_READING_MS_PER_CHAR,
      AGENT_READING_MAX_MS
    )
    await new Promise((r) => setTimeout(r, readingDelay))
  }

  // Create message ID for streaming updates
  const messageId = crypto.randomUUID()

  // False-start typing — simulates typing then deleting (disabled: set to 0)
  if (
    AGENT_FALSE_START_CHANCE > 0 &&
    Math.random() < AGENT_FALSE_START_CHANCE
  ) {
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
  await broadcastBotMessage({
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
  const effectiveRoomId = roomId ?? partyRoom.id
  await persistAgentMessage(
    effectiveRoomId,
    messageId,
    agent,
    fullResponse,
    zone
  )
}

export async function initiateAgentChat(
  room: Room,
  agent: Player,
  zone: ZoneType,
  trigger: InitiativeTrigger,
  partyRoom: Party.Room,
  connToPlayer: Map<string, string>,
  liveZones: Map<string, ZoneType>,
  state: GameState,
  roomId?: string
) {
  // Discovery delay for initiative: simulate deciding to speak
  const discoveryDelay = 1000 + Math.random() * 2000
  await new Promise((r) => setTimeout(r, discoveryDelay))

  // API budget check — initiative messages are low priority, skip if over budget
  if (!consumeApiBudget(state)) return

  const playersInZone = getPlayersInZone(zone, liveZones)
  const playerNames = playersInZone
    .map(
      (id) => state.displayNames.get(id) ?? id.slice(0, FALLBACK_NAME_LENGTH)
    )
    .filter((n) => n !== agent.displayName)

  const zoneHistory = agent.chatHistory.find((h) => h.zone === zone)
  const recentMessages = (zoneHistory?.messages ?? []).slice(-5)

  const memory = buildAgentMemory(agent.id, zone, state)

  const systemPrompt = buildInitiativePrompt(agent, room, trigger, {
    playersInZone: playerNames,
    recentMessages,
    memory,
  })

  const rawResponse = await generateAgentResponse(systemPrompt, [])
  if (!rawResponse.trim()) return

  const persona = PERSONAS.find((p) => p.id === agent.id)
  const fullResponse = persona
    ? humanizeText(rawResponse, persona)
    : rawResponse

  // Log to agent message log for collective memory
  appendToAgentLog(state, agent.id, fullResponse, zone)

  const profile = TYPING_PROFILES[agent.id] ?? TYPING_PROFILES['default']
  const messageId = crypto.randomUUID()

  // Stream response at human pace with typing indicators
  await broadcastBotMessage({
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
  const effectiveRoomId = roomId ?? partyRoom.id
  await persistAgentMessage(
    effectiveRoomId,
    messageId,
    agent,
    fullResponse,
    zone,
    playersInZone
  )
}

async function broadcastBotMessage(opts: {
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

  // Thinking pause — no dots shown, simulates reading/deciding to respond
  const thinkingMs = calculateThinkingDuration(profile)
  await new Promise((r) => setTimeout(r, thinkingMs))

  // Typing indicator ON — dots only during "typing" phase
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

  try {
    // Wait for capped typing duration — keeps dots brief and realistic
    const rawTypingMs = calculateTypingDuration(fullResponse, profile)
    const typingMs = Math.min(rawTypingMs, MAX_TYPING_INDICATOR_MS)
    await new Promise((r) => setTimeout(r, typingMs))

    // Deliver complete message at once
    const finalMsg: ChatMessage = {
      id: messageId,
      playerId: agent.id,
      displayName: agent.displayName,
      content: fullResponse,
      zone,
      timestamp: Date.now(),
    }
    broadcastToZone(
      partyRoom,
      connToPlayer,
      zone,
      liveZones,
      JSON.stringify({ type: 'chat_message', message: finalMsg })
    )
  } finally {
    // Typing indicator OFF — always sent even if error occurs
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
}

function buildAgentMemory(
  agentId: string,
  currentZone: ZoneType,
  state: GameState
): AgentMemoryContext {
  const selfMessages: string[] = []
  const crossZoneContext: AgentMemoryContext['crossZoneContext'] = []

  for (const [id, entries] of state.agentMessageLog) {
    if (id === agentId) {
      // Self-memory: all own messages (most recent last)
      for (const entry of entries.slice(-AGENT_SELF_MEMORY_MAX)) {
        selfMessages.push(entry.content)
      }
    } else {
      // Cross-zone context: other agents' messages from zones this agent isn't in
      const otherZoneEntries = entries.filter((e) => e.zone !== currentZone)
      for (const entry of otherZoneEntries.slice(-AGENT_CROSS_CONTEXT_MAX)) {
        const displayName =
          state.displayNames.get(id) ?? id.slice(0, FALLBACK_NAME_LENGTH)
        crossZoneContext.push({ displayName, content: entry.content })
      }
    }
  }

  const emotionalContext = getEmotionalPromptContext(state, agentId)

  return { selfMessages, crossZoneContext, emotionalContext }
}

function appendToAgentLog(
  state: GameState,
  agentId: string,
  content: string,
  zone: ZoneType
) {
  const entries = state.agentMessageLog.get(agentId) ?? []
  entries.push({ content, zone })
  // Keep bounded — use the larger of the two limits
  const maxEntries =
    Math.max(AGENT_SELF_MEMORY_MAX, AGENT_CROSS_CONTEXT_MAX) * 2
  if (entries.length > maxEntries) {
    entries.splice(0, entries.length - maxEntries)
  }
  state.agentMessageLog.set(agentId, entries)
}

async function persistAgentMessage(
  roomId: string,
  messageId: string,
  agent: Player,
  content: string,
  zone: ZoneType,
  playersInZone?: string[]
) {
  try {
    const { roomStore } = await import('../../lib/game/room-store')
    const chatMsg: ChatMessage = {
      id: messageId,
      playerId: agent.id,
      displayName: agent.displayName,
      content,
      zone,
      timestamp: Date.now(),
    }
    await roomStore.update(roomId, (r) => {
      if (playersInZone) {
        for (const pId of playersInZone) {
          const player = r.players.get(pId)
          if (player) appendToChatHistory(player, zone, chatMsg)
        }
      } else {
        const agentPlayer = r.players.get(agent.id)
        if (agentPlayer) appendToChatHistory(agentPlayer, zone, chatMsg)
      }
      return r
    })
  } catch (e) {
    console.error('[persistAgentMessage] Redis chat history persist failed:', e)
  }
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
