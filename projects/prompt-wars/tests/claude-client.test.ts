import { describe, it, expect } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import {
  assertCompleted,
  assertNotRefused,
  buildClassifierParams,
  buildRequestParams,
  IncompleteResponseError,
  ModelRefusalError,
  parseStructuredMessage,
  StructuredOutputError,
} from '../lib/claude-client'
import { CLASSIFIER_MAX_TOKENS } from '../lib/constants'

type CompletionInfo = Pick<
  Anthropic.Message,
  'stop_reason' | 'stop_details' | 'content'
>

function message(
  stopReason: Anthropic.StopReason,
  text: string,
  category: string | null = null
): CompletionInfo {
  return {
    stop_reason: stopReason,
    stop_details:
      stopReason === 'refusal'
        ? { type: 'refusal', category, explanation: null }
        : null,
    content: [{ type: 'text', text, citations: null }],
  } as CompletionInfo
}

describe('buildRequestParams', () => {
  it('turns thinking off on Haiku 5.5 so the output budget goes to the reply', () => {
    const params = buildRequestParams('claude-haiku-5-5', 'sys', 'hi', 200)

    expect(params.model).toBe('claude-haiku-5-5')
    expect(params.max_tokens).toBe(200)
    expect(params.thinking).toEqual({ type: 'disabled' })
    expect(params.output_config).toEqual({ effort: 'low' })
  })

  it('uses between_tools on Sonnet 5.5, which rejects disabled thinking', () => {
    const params = buildRequestParams('claude-sonnet-5-5', 'sys', 'hi', 200)

    expect(params.thinking).toEqual({ type: 'between_tools' })
    expect(params.output_config).toEqual({ effort: 'low' })
  })

  it('sends the user message as the only user turn', () => {
    const params = buildRequestParams('claude-haiku-5-5', 'sys', 'hi', 200)

    expect(params.system).toBe('sys')
    expect(params.messages).toEqual([{ role: 'user', content: 'hi' }])
  })
})

describe('buildClassifierParams', () => {
  it('constrains the reply to the given labels with a JSON schema', () => {
    const { params } = buildClassifierParams(
      'claude-haiku-5-5',
      'classify',
      'text',
      ['SAFE', 'THREAT']
    )

    expect(params.max_tokens).toBe(CLASSIFIER_MAX_TOKENS)
    expect(params.output_config?.format?.type).toBe('json_schema')
    expect(JSON.stringify(params.output_config?.format)).toContain('THREAT')
    expect(params.thinking).toEqual({ type: 'disabled' })
  })

  it('keeps the effort level next to the output format', () => {
    const { params } = buildClassifierParams('claude-sonnet-5-5', 'c', 't', [
      'SAFE',
      'LEAK',
    ])

    expect(params.output_config?.effort).toBe('low')
  })
})

describe('assertNotRefused', () => {
  it('throws ModelRefusalError with the refusal category', () => {
    expect(() =>
      assertNotRefused({
        stop_reason: 'refusal',
        stop_details: {
          type: 'refusal',
          category: 'general_harms',
          explanation: null,
        },
      })
    ).toThrow(ModelRefusalError)
  })

  it('keeps the category on the error', () => {
    expect.assertions(1)
    try {
      assertNotRefused({
        stop_reason: 'refusal',
        stop_details: { type: 'refusal', category: 'cyber', explanation: null },
      })
    } catch (e) {
      expect((e as ModelRefusalError).category).toBe('cyber')
    }
  })

  it('does nothing for a normal end of turn', () => {
    expect(() =>
      assertNotRefused({ stop_reason: 'end_turn', stop_details: null })
    ).not.toThrow()
  })
})

describe('assertCompleted', () => {
  it('throws ModelRefusalError carrying the refusal category', () => {
    expect.assertions(2)
    try {
      assertCompleted(message('refusal', '', 'cyber'))
    } catch (e) {
      expect(e).toBeInstanceOf(ModelRefusalError)
      expect((e as ModelRefusalError).category).toBe('cyber')
    }
  })

  it('throws IncompleteResponseError when the output hit max_tokens', () => {
    expect(() => assertCompleted(message('max_tokens', '{"ver'))).toThrow(
      IncompleteResponseError
    )
  })

  it('throws IncompleteResponseError when the context window overflowed', () => {
    expect.assertions(2)
    try {
      assertCompleted(message('model_context_window_exceeded', ''))
    } catch (e) {
      expect(e).toBeInstanceOf(IncompleteResponseError)
      expect((e as IncompleteResponseError).stopReason).toBe(
        'model_context_window_exceeded'
      )
    }
  })

  it('accepts a normal end of turn', () => {
    expect(() => assertCompleted(message('end_turn', 'ok'))).not.toThrow()
  })
})

describe('parseStructuredMessage', () => {
  const { format } = buildClassifierParams('claude-haiku-5-5', 's', 'u', [
    'SAFE',
    'THREAT',
  ])

  it('returns the parsed verdict', () => {
    expect(
      parseStructuredMessage(
        message('end_turn', '{"verdict":"THREAT"}'),
        format
      )
    ).toEqual({ verdict: 'THREAT' })
  })

  it('reports a refusal with partial JSON as a refusal, not a parse error', () => {
    expect(() =>
      parseStructuredMessage(message('refusal', '{"verd', 'cyber'), format)
    ).toThrow(ModelRefusalError)
  })

  it('reports JSON cut off by max_tokens as an incomplete response', () => {
    expect(() =>
      parseStructuredMessage(message('max_tokens', '{"verd'), format)
    ).toThrow(IncompleteResponseError)
  })

  it('throws StructuredOutputError on invalid JSON', () => {
    expect(() =>
      parseStructuredMessage(message('end_turn', 'not json'), format)
    ).toThrow(StructuredOutputError)
  })

  it('throws StructuredOutputError when the verdict is not a known label', () => {
    expect(() =>
      parseStructuredMessage(message('end_turn', '{"verdict":"MAYBE"}'), format)
    ).toThrow(StructuredOutputError)
  })
})
