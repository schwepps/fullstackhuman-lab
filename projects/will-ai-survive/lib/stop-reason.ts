import type Anthropic from '@anthropic-ai/sdk'

export function stopReasonError(
  stopReason: Anthropic.StopReason | null
): string | null {
  switch (stopReason) {
    case 'refusal':
      return "Sorry, the AI can't evaluate this situation. Try describing it differently."
    case 'max_tokens':
      return 'AI produced an incomplete evaluation. Please try again.'
    default:
      return null
  }
}
