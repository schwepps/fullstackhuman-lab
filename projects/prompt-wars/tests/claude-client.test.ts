import { describe, it, expect } from 'vitest'
import {
  assertNotRefused,
  buildClassifierParams,
  buildRequestParams,
  ModelRefusalError,
} from '../lib/claude-client'
import { CLASSIFIER_MAX_TOKENS } from '../lib/constants'

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
    const params = buildClassifierParams(
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
    const params = buildClassifierParams('claude-sonnet-5-5', 'c', 't', [
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
