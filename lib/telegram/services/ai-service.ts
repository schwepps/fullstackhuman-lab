import { getAnthropicClient } from '@/lib/ai/client'
import { assembleSystemPrompt } from '@/lib/ai/prompt-assembler'
import { ANTHROPIC_MODEL, ANTHROPIC_MAX_TOKENS } from '@/lib/constants/chat'
import { AI_RESPONSE_TIMEOUT_MS } from '@/lib/telegram/constants'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import type { PersonaId, MessageRole } from '@/types/chat'

/**
 * Call the Claude API (non-streaming) with a timeout.
 * Returns the text response or null on failure/timeout.
 */
export async function callAI(params: {
  systemPrompt: string
  messages: Array<{ role: MessageRole; content: string }>
}): Promise<string | null> {
  try {
    const client = getAnthropicClient()

    const responsePromise = client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: params.systemPrompt,
      messages: params.messages,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('AI response timeout')),
        AI_RESPONSE_TIMEOUT_MS
      )
    })

    const response = await Promise.race([responsePromise, timeoutPromise])

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
 * Assemble the full system prompt for a persona.
 */
export async function assemblePrompt(persona: PersonaId): Promise<string> {
  return assembleSystemPrompt(persona)
}

// Re-export from shared SSOT module for Telegram handler convenience
export { detectReport } from '@/lib/ai/detect-report'
