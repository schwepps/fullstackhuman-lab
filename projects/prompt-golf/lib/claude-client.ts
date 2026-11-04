import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'
import type { ModelCall } from './model-call'

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

// Haiku 5.5 accepts disabled thinking; Sonnet 5.5 rejects it and uses
// between_tools, which also skips thinking on a single-turn request.
function thinkingFor(call: ModelCall): Anthropic.ThinkingConfigParam {
  if (call.thinking === 'adaptive') return { type: 'adaptive' }
  return call.model === 'claude-sonnet-5-5'
    ? { type: 'between_tools' }
    : { type: 'disabled' }
}

export function buildRequestParams(
  call: ModelCall,
  systemPrompt: string,
  userMessage: string
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: call.model,
    max_tokens: call.maxTokens,
    system: systemPrompt,
    thinking: thinkingFor(call),
    output_config: { effort: call.effort },
    messages: [{ role: 'user', content: userMessage }],
  }
}

export function buildStructuredParams<T>(
  call: ModelCall,
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>
) {
  const format = zodOutputFormat(schema)
  const base = buildRequestParams(call, systemPrompt, userMessage)
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    ...base,
    output_config: { effort: call.effort, format },
  }
  return { params, format }
}

export function assertNotRefused(message: CompletionInfo): void {
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
  return format.parse(textOf(message))
}

export async function streamText(
  call: ModelCall,
  systemPrompt: string,
  userMessage: string,
  onToken?: (token: string) => void
): Promise<string> {
  const stream = anthropic.messages.stream(
    buildRequestParams(call, systemPrompt, userMessage)
  )
  if (onToken) stream.on('text', onToken)
  const message = await stream.finalMessage()
  // Truncated code is returned as-is: the judge's structural check reports it.
  assertNotRefused(message)
  return textOf(message)
}

export async function callStructured<T>(
  call: ModelCall,
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>
): Promise<T> {
  const { params, format } = buildStructuredParams(
    call,
    systemPrompt,
    userMessage,
    schema
  )
  const message = await anthropic.messages.create(params)
  return parseStructuredMessage(message, format)
}
