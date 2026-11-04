import type Anthropic from '@anthropic-ai/sdk'

export const INCOMPLETE_EVALUATION_ERROR =
  'AI produced an incomplete evaluation. Please try again.'

const REFUSAL_ERROR =
  "Sorry, the AI can't evaluate this situation. Try describing it differently."

export function stopReasonError(
  stopReason: Anthropic.StopReason | null
): string | null {
  switch (stopReason) {
    case 'refusal':
      return REFUSAL_ERROR
    case 'max_tokens':
    case 'model_context_window_exceeded':
      return INCOMPLETE_EVALUATION_ERROR
    default:
      return null
  }
}
