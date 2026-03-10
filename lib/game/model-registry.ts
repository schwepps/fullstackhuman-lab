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

const AGENT_MODEL = 'claude-haiku-4-5'
const MAX_RETRIES = 2

export async function generateAgentResponse(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken?: (token: string) => void
): Promise<string> {
  // Anthropic API requires at least one message — add a minimal user
  // message when callers put all context in the system prompt.
  const apiMessages =
    messages.length > 0 ? messages : [{ role: 'user' as const, content: 'Go.' }]

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
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
      const isRateLimit =
        e instanceof Anthropic.RateLimitError ||
        (e instanceof Error &&
          'status' in e &&
          (e as { status: number }).status === 429)

      if (isRateLimit && attempt < MAX_RETRIES) {
        // Parse retry-after header or use exponential backoff
        const retryAfterHeader =
          e instanceof Anthropic.APIError
            ? e.headers?.get?.('retry-after')
            : null
        const parsed = retryAfterHeader ? Number(retryAfterHeader) : NaN
        const retryAfterMs =
          Number.isFinite(parsed) && parsed > 0
            ? Math.min(parsed * 1000, 30_000)
            : 2000 * 2 ** attempt
        console.warn(
          `[generateAgentResponse] Rate limited, retrying in ${retryAfterMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await new Promise((r) => setTimeout(r, retryAfterMs))
        continue
      }

      console.error('[generateAgentResponse] Anthropic API call failed:', e)
      return ''
    }
  }

  return ''
}
