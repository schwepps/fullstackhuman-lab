import Anthropic from '@anthropic-ai/sdk'
import { MAX_AGENT_TOKENS } from './constants'

// Cloudflare Workers/miniflare don't support `cache` in fetch init.
// The Anthropic SDK sets `cache: 'no-store'` by default — strip it.
const anthropic = new Anthropic({
  fetch: (url: RequestInfo | URL, init?: RequestInit) => {
    if (init) {
      const { cache: _, ...rest } = init as RequestInit & { cache?: string }
      return globalThis.fetch(url, rest)
    }
    return globalThis.fetch(url)
  },
})

const AGENT_MODEL = 'claude-sonnet-4-6'

export async function generateAgentResponse(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken?: (token: string) => void
): Promise<string> {
  try {
    // Anthropic API requires at least one message — add a minimal user
    // message when callers put all context in the system prompt.
    const apiMessages =
      messages.length > 0
        ? messages
        : [{ role: 'user' as const, content: 'Go.' }]

    const stream = anthropic.messages.stream({
      model: AGENT_MODEL,
      max_tokens: MAX_AGENT_TOKENS,
      system: systemPrompt,
      messages: apiMessages,
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
  } catch (e) {
    console.error('[generateAgentResponse] Anthropic API call failed:', e)
    return ''
  }
}
