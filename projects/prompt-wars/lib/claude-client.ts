import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { CLASSIFIER_MAX_TOKENS } from './constants'
import type { ClaudeModel } from './types'

// The SDK already retries 429, 5xx and connection errors (honoring retry-after).
const anthropic = new Anthropic()

const EFFORT = 'low' as const

export class ModelRefusalError extends Error {
  readonly category: string | null

  constructor(category: string | null) {
    super(`Model refused to answer (category: ${category ?? 'none'})`)
    this.name = 'ModelRefusalError'
    this.category = category
  }
}

// Haiku 5.5 accepts disabled thinking; Sonnet 5.5 rejects it and uses
// between_tools, which also skips thinking on a single-turn request.
function thinkingFor(model: ClaudeModel): Anthropic.ThinkingConfigParam {
  return model === 'claude-sonnet-5-5'
    ? { type: 'between_tools' }
    : { type: 'disabled' }
}

export function buildRequestParams(
  model: ClaudeModel,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    thinking: thinkingFor(model),
    output_config: { effort: EFFORT },
    messages: [{ role: 'user', content: userMessage }],
  }
}

export function buildClassifierParams<const L extends string>(
  model: ClaudeModel,
  systemPrompt: string,
  userMessage: string,
  labels: readonly [L, ...L[]]
) {
  const schema = z.object({ verdict: z.enum(labels) })
  return {
    ...buildRequestParams(
      model,
      systemPrompt,
      userMessage,
      CLASSIFIER_MAX_TOKENS
    ),
    output_config: { effort: EFFORT, format: zodOutputFormat(schema) },
  }
}

export function assertNotRefused(
  message: Pick<Anthropic.Message, 'stop_reason' | 'stop_details'>
): void {
  if (message.stop_reason === 'refusal') {
    throw new ModelRefusalError(message.stop_details?.category ?? null)
  }
}

export async function callClaude(
  model: ClaudeModel,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const message = await anthropic.messages.create(
    buildRequestParams(model, systemPrompt, userMessage, maxTokens)
  )
  assertNotRefused(message)
  return message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
}

export async function callClassifier<const L extends string>(
  model: ClaudeModel,
  systemPrompt: string,
  userMessage: string,
  labels: readonly [L, ...L[]]
): Promise<L> {
  const message = await anthropic.messages.parse(
    buildClassifierParams(model, systemPrompt, userMessage, labels)
  )
  assertNotRefused(message)
  const verdict = message.parsed_output?.verdict
  if (!verdict) {
    throw new Error('[callClassifier] Classifier returned no verdict')
  }
  return verdict
}
