import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const MAX_RETRIES = 2

export async function callClaude(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  onToken?: (token: string) => void
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
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
          `[callClaude] Rate limited, retrying in ${retryAfterMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await new Promise((r) => setTimeout(r, retryAfterMs))
        continue
      }

      console.error('[callClaude] Anthropic API call failed:', e)
      throw e
    }
  }

  throw new Error('[callClaude] Exhausted retries')
}
