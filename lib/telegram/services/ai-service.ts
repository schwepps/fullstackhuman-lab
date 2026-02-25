import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages/messages'
import { getAnthropicClient } from '@/lib/ai/client'
import {
  assembleSystemPromptParts,
  buildSystemBlocks,
} from '@/lib/ai/prompt-assembler'
import { getWrapUpInjection } from '@/lib/ai/conversation-limits'
import { ANTHROPIC_MODEL, ANTHROPIC_MAX_TOKENS } from '@/lib/constants/chat'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import type { PersonaId, MessageRole } from '@/types/chat'

/** Per-request timeout for Claude API calls (45s × 2 attempts = 90s < maxDuration 120s, ~30s for post-processing) */
const AI_REQUEST_TIMEOUT_MS = 45_000

/**
 * Call the Claude API (non-streaming) with SDK-managed timeout.
 * Accepts system content blocks with cache_control for prompt caching.
 * Returns the text response or null on failure/timeout.
 */
export async function callAI(params: {
  systemBlocks: Array<TextBlockParam>
  messages: Array<{ role: MessageRole; content: string }>
}): Promise<string | null> {
  try {
    const client = getAnthropicClient()

    const response = await client.messages.create(
      {
        model: ANTHROPIC_MODEL,
        max_tokens: ANTHROPIC_MAX_TOKENS,
        system: params.systemBlocks,
        messages: params.messages,
      },
      { timeout: AI_REQUEST_TIMEOUT_MS, maxRetries: 1 }
    )

    const firstBlock = response.content[0]
    if (firstBlock.type !== 'text') return null

    return firstBlock.text
  } catch (error) {
    log('error', LOG_EVENT.TELEGRAM_AI_ERROR, {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

/**
 * Build system content blocks for a Telegram AI call.
 * Assembles prompt parts from persona and applies wrap-up injection if needed.
 */
export async function buildTelegramSystemBlocks(
  persona: PersonaId,
  turnCount?: number
): Promise<Array<TextBlockParam>> {
  const promptParts = await assembleSystemPromptParts(persona)
  const injection = turnCount != null ? getWrapUpInjection(turnCount) : null
  return buildSystemBlocks(promptParts, injection)
}

// Re-export from shared SSOT module for Telegram handler convenience
export { detectReport } from '@/lib/ai/detect-report'
