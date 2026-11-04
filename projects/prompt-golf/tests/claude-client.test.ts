import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type Anthropic from '@anthropic-ai/sdk'
import {
  assertCompleted,
  assertStreamUsable,
  buildRequestParams,
  buildStructuredParams,
  IncompleteResponseError,
  ModelRefusalError,
  parseStructuredMessage,
  StructuredOutputError,
} from '../lib/claude-client'
import { ANALYZER_CALL, GENERATOR_CALL, JUDGE_CALL } from '../lib/constants'
import type { ModelCall } from '../lib/model-call'

const SONNET_NO_THINKING: ModelCall = {
  model: 'claude-sonnet-5-5',
  maxTokens: 512,
  effort: 'low',
  thinking: 'off',
}

function message(
  stopReason: Anthropic.StopReason,
  text: string,
  category: string | null = null
): Pick<Anthropic.Message, 'stop_reason' | 'stop_details' | 'content'> {
  return {
    stop_reason: stopReason,
    stop_details:
      stopReason === 'refusal'
        ? { type: 'refusal', category, explanation: null }
        : null,
    content: [{ type: 'text', text, citations: null }],
  } as Pick<Anthropic.Message, 'stop_reason' | 'stop_details' | 'content'>
}

describe('model calls', () => {
  it('runs the generator and analyzer on Haiku 5.5 and the judge on Sonnet 5.5', () => {
    expect(GENERATOR_CALL.model).toBe('claude-haiku-5-5')
    expect(ANALYZER_CALL.model).toBe('claude-haiku-5-5')
    expect(JUDGE_CALL.model).toBe('claude-sonnet-5-5')
  })

  it('keeps Haiku effort at high or below so disabled thinking is accepted', () => {
    for (const call of [GENERATOR_CALL, ANALYZER_CALL]) {
      expect(['low', 'medium', 'high']).toContain(call.effort)
    }
  })

  it('gives the thinking judge room beyond its old 2048-token reply budget', () => {
    expect(JUDGE_CALL.thinking).toBe('adaptive')
    expect(JUDGE_CALL.maxTokens).toBeGreaterThanOrEqual(8000)
  })
})

describe('buildRequestParams', () => {
  it('disables thinking on Haiku 5.5', () => {
    const params = buildRequestParams(GENERATOR_CALL, 'sys', 'hi')

    expect(params.model).toBe('claude-haiku-5-5')
    expect(params.max_tokens).toBe(GENERATOR_CALL.maxTokens)
    expect(params.thinking).toEqual({ type: 'disabled' })
    expect(params.output_config).toEqual({ effort: GENERATOR_CALL.effort })
  })

  it('uses between_tools to skip thinking on Sonnet 5.5, which rejects disabled', () => {
    const params = buildRequestParams(SONNET_NO_THINKING, 'sys', 'hi')

    expect(params.thinking).toEqual({ type: 'between_tools' })
  })

  it('uses adaptive thinking for the judge', () => {
    const params = buildRequestParams(JUDGE_CALL, 'sys', 'hi')

    expect(params.thinking).toEqual({ type: 'adaptive' })
    expect(params.output_config).toEqual({ effort: JUDGE_CALL.effort })
  })

  it('sends no sampling parameters, which API version 2026-10-21 rejects', () => {
    const params = buildRequestParams(GENERATOR_CALL, 'sys', 'hi')

    expect(params).not.toHaveProperty('temperature')
    expect(params).not.toHaveProperty('top_p')
    expect(params).not.toHaveProperty('top_k')
  })

  it('sends the system prompt and a single user turn', () => {
    const params = buildRequestParams(GENERATOR_CALL, 'sys', 'hi')

    expect(params.system).toBe('sys')
    expect(params.messages).toEqual([{ role: 'user', content: 'hi' }])
  })
})

describe('buildStructuredParams', () => {
  const schema = z.object({ verdict: z.enum(['PASS', 'FAIL']) })

  it('attaches a JSON schema output format next to the effort level', () => {
    const { params } = buildStructuredParams(JUDGE_CALL, 's', 'u', schema)

    expect(params.output_config?.format?.type).toBe('json_schema')
    expect(JSON.stringify(params.output_config?.format)).toContain('FAIL')
    expect(params.output_config?.effort).toBe(JUDGE_CALL.effort)
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

  it('throws IncompleteResponseError when the output was cut off', () => {
    expect(() => assertCompleted(message('max_tokens', '{"a'))).toThrow(
      IncompleteResponseError
    )
  })

  it('accepts a normal end of turn', () => {
    expect(() => assertCompleted(message('end_turn', 'ok'))).not.toThrow()
  })
})

describe('assertStreamUsable', () => {
  it('throws IncompleteResponseError when the context window overflowed', () => {
    expect(() =>
      assertStreamUsable(message('model_context_window_exceeded', 'fun'))
    ).toThrow(IncompleteResponseError)
  })

  it('lets max_tokens truncation through for the structural check', () => {
    expect(() =>
      assertStreamUsable(message('max_tokens', 'function f() {'))
    ).not.toThrow()
  })

  it('throws ModelRefusalError on a refusal', () => {
    expect(() => assertStreamUsable(message('refusal', ''))).toThrow(
      ModelRefusalError
    )
  })
})

describe('parseStructuredMessage', () => {
  const schema = z.object({ verdict: z.enum(['PASS', 'FAIL']) })
  const { format } = buildStructuredParams(JUDGE_CALL, 's', 'u', schema)

  it('returns the parsed, schema-checked output', () => {
    expect(
      parseStructuredMessage(message('end_turn', '{"verdict":"PASS"}'), format)
    ).toEqual({ verdict: 'PASS' })
  })

  it('reports a refusal before trying to parse the partial text', () => {
    expect(() =>
      parseStructuredMessage(message('refusal', '{"verd'), format)
    ).toThrow(ModelRefusalError)
  })

  it('reports truncation before trying to parse the partial text', () => {
    expect(() =>
      parseStructuredMessage(message('max_tokens', '{"verd'), format)
    ).toThrow(IncompleteResponseError)
  })

  it('throws StructuredOutputError on invalid JSON', () => {
    expect(() =>
      parseStructuredMessage(message('end_turn', 'not json'), format)
    ).toThrow(StructuredOutputError)
  })

  it('throws StructuredOutputError when the JSON misses the schema', () => {
    expect(() =>
      parseStructuredMessage(message('end_turn', '{"verdict":"MAYBE"}'), format)
    ).toThrow(StructuredOutputError)
  })
})
