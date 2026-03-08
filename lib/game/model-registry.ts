import Anthropic from '@anthropic-ai/sdk'
import { MAX_AGENT_TOKENS } from './constants'

const anthropic = new Anthropic()

const AGENT_MODEL = 'claude-sonnet-4-6'

export async function generateAgentResponse(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken?: (token: string) => void
): Promise<string> {
  const stream = anthropic.messages.stream({
    model: AGENT_MODEL,
    max_tokens: MAX_AGENT_TOKENS,
    system: systemPrompt,
    messages,
  })

  let fullResponse = ''

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullResponse += event.delta.text
      onToken?.(event.delta.text)
    }
  }

  return fullResponse
}
