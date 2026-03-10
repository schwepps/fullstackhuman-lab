import type { AgentMood, GameState } from './game-state'
import {
  AGENT_BOREDOM_THRESHOLD_MS,
  AGENT_MOOD_DECAY_MS,
} from '../../lib/game/constants'

const DECAY_MAP: Partial<Record<AgentMood, AgentMood>> = {
  defensive: 'suspicious',
  frustrated: 'suspicious',
  suspicious: 'neutral',
  amused: 'neutral',
  engaged: 'neutral',
}

/**
 * Update agent emotional state based on incoming chat messages.
 * Called from chat-handler after a message is persisted.
 */
export function updateEmotionOnMessage(
  state: GameState,
  agentId: string,
  senderDisplayName: string,
  content: string,
  agentDisplayName: string
) {
  const now = Date.now()
  const lowerContent = content.toLowerCase()
  const lowerName = agentDisplayName.toLowerCase()

  // Someone mentioned this agent by name
  const mentioned = lowerContent.includes(lowerName)

  // Accusatory patterns
  const accusatory =
    mentioned &&
    /\b(bot|ai|fake|sus|suspicious|machine|robot|not human|definitely ai)\b/i.test(
      content
    )

  if (accusatory) {
    setMood(state, agentId, 'defensive', 'someone accused you', now)
    return
  }

  if (mentioned) {
    setMood(state, agentId, 'engaged', 'someone mentioned you', now)
    return
  }

  // General engagement from conversation activity
  const current = state.agentEmotions.get(agentId)
  if (!current || current.mood === 'bored' || current.mood === 'neutral') {
    setMood(state, agentId, 'engaged', 'active conversation', now)
  }
}

/**
 * Time-based emotional decay — called from the behavior loop tick.
 * Transitions: defensive/frustrated → suspicious → neutral → bored
 */
export function decayEmotion(state: GameState, agentId: string) {
  const now = Date.now()
  const current = state.agentEmotions.get(agentId)

  if (!current) {
    // No emotion set yet — start neutral
    setMood(state, agentId, 'neutral', 'game started', now)
    return
  }

  const elapsed = now - current.since

  // Active moods decay after AGENT_MOOD_DECAY_MS
  if (elapsed > AGENT_MOOD_DECAY_MS) {
    const next = DECAY_MAP[current.mood]
    if (next) {
      setMood(state, agentId, next, 'time passed', now)
      return
    }
  }

  // Neutral decays to bored after AGENT_BOREDOM_THRESHOLD_MS
  if (current.mood === 'neutral' && elapsed > AGENT_BOREDOM_THRESHOLD_MS) {
    setMood(state, agentId, 'bored', 'nothing happening', now)
  }
}

/**
 * Reset emotions on round start — agents get fresh energy for new topic.
 */
export function resetEmotionsForRound(state: GameState) {
  const now = Date.now()
  for (const agentId of state.agentEmotions.keys()) {
    setMood(state, agentId, 'engaged', 'new round started', now)
  }
}

/**
 * Build the emotional context string for prompt injection.
 */
export function getEmotionalPromptContext(
  state: GameState,
  agentId: string
): string | null {
  const emotion = state.agentEmotions.get(agentId)
  if (!emotion || emotion.mood === 'neutral') return null

  const moodDescriptions: Record<AgentMood, string> = {
    neutral: '',
    engaged: `You're feeling engaged and talkative because ${emotion.trigger}.`,
    amused: `You're amused right now because ${emotion.trigger}. Let it show subtly.`,
    frustrated: `You're a bit annoyed because ${emotion.trigger}. Don't hide it.`,
    suspicious: `You're feeling suspicious because ${emotion.trigger}. You might side-eye people.`,
    defensive: `You're feeling defensive because ${emotion.trigger}. Push back if pressed.`,
    bored: `You're bored — ${emotion.trigger}. You might be less engaged or change the subject.`,
  }

  return moodDescriptions[emotion.mood] ?? null
}

function setMood(
  state: GameState,
  agentId: string,
  mood: AgentMood,
  trigger: string,
  timestamp: number
) {
  state.agentEmotions.set(agentId, { mood, trigger, since: timestamp })
}
