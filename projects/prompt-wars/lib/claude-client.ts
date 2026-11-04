import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { CLASSIFIER_MAX_TOKENS, MODEL_EFFORT } from './constants'
import type { ClaudeModel } from './types'

// The SDK already retries 429, 5xx and connection errors (honoring retry-after).
const anthropic = new Anthropic()

type CompletionInfo = Pick<
  Anthropic.Message,
  'stop_reason' | 'stop_details' | 'content'
>

type StructuredFormat<T> = ReturnType<typeof zodOutputFormat<z.ZodType<T>>>

export class ModelRefusalError extends Error {
  readonly category: string | null

  constructor(category: string | null) {
    super(`Model refused to answer (category: ${category ?? 'none'})`)
    this.name = 'ModelRefusalError'
    this.category = category
  }
}

export class IncompleteResponseError extends Error {
  readonly stopReason: string

  constructor(stopReason: string) {
    super(`Model output was cut off (stop_reason: ${stopReason})`)
    this.name = 'IncompleteResponseError'
    this.stopReason = stopReason
  }
}

export class StructuredOutputError extends Error {
  constructor(cause: unknown) {
    super(
      `Structured output did not match the schema: ${cause instanceof Error ? cause.message : String(cause)}`
    )
    this.name = 'StructuredOutputError'
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
    output_config: { effort: MODEL_EFFORT },
    messages: [{ role: 'user', content: userMessage }],
  }
}

export function buildClassifierParams<const L extends string>(
  model: ClaudeModel,
  systemPrompt: string,
  userMessage: string,
  labels: readonly [L, ...L[]]
) {
  const format = zodOutputFormat(z.object({ verdict: z.enum(labels) }))
  const base = buildRequestParams(
    model,
    systemPrompt,
    userMessage,
    CLASSIFIER_MAX_TOKENS
  )
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    ...base,
    output_config: { effort: MODEL_EFFORT, format },
  }
  return { params, format }
}

export function assertNotRefused(
  message: Pick<Anthropic.Message, 'stop_reason' | 'stop_details'>
): void {
  if (message.stop_reason === 'refusal') {
    throw new ModelRefusalError(message.stop_details?.category ?? null)
  }
}

export function assertCompleted(message: CompletionInfo): void {
  assertNotRefused(message)
  if (
    message.stop_reason === 'max_tokens' ||
    message.stop_reason === 'model_context_window_exceeded'
  ) {
    throw new IncompleteResponseError(message.stop_reason)
  }
}

function textOf(message: CompletionInfo): string {
  return message.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
}

// Checked before parsing: a refusal or truncation leaves partial JSON that
// would otherwise surface as a misleading parse error.
export function parseStructuredMessage<T>(
  message: CompletionInfo,
  format: StructuredFormat<T>
): T {
  assertCompleted(message)
  try {
    return format.parse(textOf(message))
  } catch (error) {
    throw new StructuredOutputError(error)
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
  return textOf(message)
}

export async function callClassifier<const L extends string>(
  model: ClaudeModel,
  systemPrompt: string,
  userMessage: string,
  labels: readonly [L, ...L[]]
): Promise<L> {
  const { params, format } = buildClassifierParams(
    model,
    systemPrompt,
    userMessage,
    labels
  )
  const message = await anthropic.messages.create(params)
  return parseStructuredMessage(message, format).verdict
}
