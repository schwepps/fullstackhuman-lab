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

/**
 * Call the Claude API via streaming + collect.
 * Streaming keeps the HTTP connection alive token-by-token, eliminating idle
 * timeouts that occur with non-streaming calls on long reports (~2000-3500 tokens).
 * The overall ceiling is maxDuration = 120 on the webhook route.
 * Returns the text response or null on failure.
 */
export async function callAI(params: {
  systemBlocks: Array<TextBlockParam>
  messages: Array<{ role: MessageRole; content: string }>
}): Promise<string | null> {
  try {
    const client = getAnthropicClient()

    const stream = client.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: params.systemBlocks,
      messages: params.messages,
    })

    const response = await stream.finalMessage()

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
