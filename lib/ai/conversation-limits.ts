/**
 * Conversation depth limiting — shared SSOT for web chat and Telegram.
 *
 * Enforces a 3-phase wrap-up system:
 * 1. Normal (turns 1-8): no intervention
 * 2. Wrap-up (turns 9-11): AI steered toward report
 * 3. Force report (turns 12-14): AI must generate report
 * 4. Hard cap (turn 15+): no AI call, conversation ends
 */

// --- Constants ---

/** Maximum user turns before hard cap */
export const MAX_USER_TURNS = 15

/** Turn at which wrap-up guidance begins */
export const WRAP_UP_START_TURN = 9

/** Turn at which AI is forced to generate the report */
export const FORCE_REPORT_TURN = 12

/** Max messages sent to Claude per call (sliding window) */
export const MAX_CONTEXT_MESSAGES = 20

// --- Types ---

export type ConversationPhase =
  | 'normal'
  | 'wrap-up'
  | 'force-report'
  | 'hard-cap'

// --- Functions ---

/**
 * Compute the user turn count from the total message count.
 *
 * Message array structure: [trigger, opening, user1, assistant1, user2, ...]
 * Turn 1 = first real user message (messages.length = 3)
 * Turn N = messages.length = 1 + N*2
 */
export function getUserTurnCount(messageCount: number): number {
  if (messageCount < 3) return 0
  return Math.floor((messageCount - 1) / 2)
}

/**
 * Determine the conversation phase from the user turn count.
 */
export function getConversationPhase(turnCount: number): ConversationPhase {
  if (turnCount >= MAX_USER_TURNS) return 'hard-cap'
  if (turnCount >= FORCE_REPORT_TURN) return 'force-report'
  if (turnCount >= WRAP_UP_START_TURN) return 'wrap-up'
  return 'normal'
}

/**
 * Get the number of user turns remaining before hard cap.
 */
export function getRemainingTurns(turnCount: number): number {
  return Math.max(0, MAX_USER_TURNS - turnCount)
}

/**
 * Generate system prompt injection text for the current phase.
 * Returns null for the 'normal' and 'hard-cap' phases.
 */
export function getWrapUpInjection(turnCount: number): string | null {
  const phase = getConversationPhase(turnCount)
  const remaining = getRemainingTurns(turnCount)

  if (phase === 'wrap-up') {
    return `<conversation_guidance>
IMPORTANT: This conversation is approaching its natural conclusion. You have ${remaining} exchanges left.
Begin steering toward your final deliverable (the report). Summarize key findings and signal to the user
that you are ready to write the report when they are. Do not abruptly end — maintain your consulting persona
while guiding toward closure.
</conversation_guidance>`
  }

  if (phase === 'force-report') {
    return `<conversation_guidance>
CRITICAL: This is your final exchange. You MUST generate your report now. Synthesize everything discussed
into your persona's report format. The user has had sufficient time for input. Write the full report
in this response.
</conversation_guidance>`
  }

  return null
}

/**
 * Truncate message history to a sliding window for cost control.
 *
 * Always keeps the first message (trigger) + the last (MAX_CONTEXT_MESSAGES - 1)
 * messages. This preserves persona context while capping token costs.
 */
export function truncateHistory<T>(messages: T[]): T[] {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages
  return [messages[0], ...messages.slice(-(MAX_CONTEXT_MESSAGES - 1))]
}
