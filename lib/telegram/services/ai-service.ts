import type { TextBlockParam } from '@anthropic-ai/sdk/resources/messages/messages'
import { getAnthropicClient } from '@/lib/ai/client'
import {
  assembleSystemPromptParts,
  buildSystemBlocks,
} from '@/lib/ai/prompt-assembler'
import { getWrapUpInjection } from '@/lib/ai/conversation-limits'
import { getTools } from '@/lib/ai/tools'
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
      tools: getTools(),
    })

    const response = await stream.finalMessage()

    // Log web search usage for cost monitoring
    const searches = response.usage.server_tool_use?.web_search_requests
    if (searches) {
      log('info', LOG_EVENT.WEB_SEARCH_USAGE, { searches })
    }

    // With web search enabled, response may contain interleaved
    // web_search_tool_result blocks — collect text from all text blocks.
    const text = response.content
      .filter(
        (block): block is Extract<typeof block, { type: 'text' }> =>
          block.type === 'text'
      )
      .map((block) => block.text)
      .join('')

    return text || null
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
