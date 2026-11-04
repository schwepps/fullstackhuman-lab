import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChallenge, isCodeChallenge } from '../lib/challenges'
import {
  IncompleteResponseError,
  ModelRefusalError,
  StructuredOutputError,
} from '../lib/claude-client'
import { ANALYZER_CALL } from '../lib/constants'
import {
  analyzeSwing,
  PASS_ANALYSIS_SCHEMA,
  HINT_ANALYSIS_SCHEMA,
} from '../lib/swing-analyzer'
import type { CodeChallenge } from '../lib/types'

const callStructured = vi.hoisted(() => vi.fn())

vi.mock('../lib/claude-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/claude-client')>()),
  callStructured,
}))

function chunkChallenge(): CodeChallenge {
  const challenge = getChallenge('chunk-array')
  if (!challenge || !isCodeChallenge(challenge)) {
    throw new Error('chunk-array fixture missing')
  }
  return challenge
}

const CODE = 'function chunk() { return [] }'

describe('analyzeSwing', () => {
  beforeEach(() => {
    callStructured.mockReset()
  })

  it('asks for the optimal prompt and concept on a passing swing', async () => {
    callStructured.mockResolvedValue({
      summary: 'Load-bearing: chunk.',
      detail: 'Details.',
      optimalPrompt: 'chunk array',
      concept: 'Named patterns carry the spec.',
    })

    const analysis = await analyzeSwing(chunkChallenge(), 'p', CODE, 'pass', 3)

    expect(callStructured).toHaveBeenCalledWith(
      ANALYZER_CALL,
      expect.any(String),
      expect.any(String),
      PASS_ANALYSIS_SCHEMA
    )
    expect(analysis.optimalPrompt).toBe('chunk array')
    expect(analysis.concept).toBe('Named patterns carry the spec.')
  })

  it('uses the hint-only schema on a failing swing, so nothing is spoiled', async () => {
    callStructured.mockResolvedValue({ summary: 'Misread.', detail: 'Hint.' })

    const analysis = await analyzeSwing(chunkChallenge(), 'p', CODE, 'fail', 3)

    expect(callStructured).toHaveBeenCalledWith(
      ANALYZER_CALL,
      expect.any(String),
      expect.any(String),
      HINT_ANALYSIS_SCHEMA
    )
    expect(analysis).toEqual({
      summary: 'Misread.',
      detail: 'Hint.',
      optimalPrompt: null,
      concept: null,
    })
  })

  it('falls back to a placeholder when the analyzer refuses', async () => {
    callStructured.mockRejectedValue(new ModelRefusalError(null))

    const analysis = await analyzeSwing(chunkChallenge(), 'p', CODE, 'pass', 3)

    expect(analysis.summary).toBe('Analysis unavailable.')
    expect(analysis.optimalPrompt).toBeNull()
  })

  it('falls back to a placeholder when the analysis is cut off', async () => {
    callStructured.mockRejectedValue(new IncompleteResponseError('max_tokens'))

    const analysis = await analyzeSwing(chunkChallenge(), 'p', CODE, 'fail', 3)

    expect(analysis.summary).toBe('Analysis unavailable.')
  })
})

describe('analyzeSwing errors', () => {
  beforeEach(() => {
    callStructured.mockReset()
  })

  it('falls back to a placeholder when the analysis is not valid JSON', async () => {
    callStructured.mockRejectedValue(new StructuredOutputError('bad json'))

    const analysis = await analyzeSwing(chunkChallenge(), 'p', CODE, 'pass', 3)

    expect(analysis.summary).toBe('Analysis unavailable.')
  })

  it('still surfaces API failures', async () => {
    callStructured.mockRejectedValue(new Error('overloaded'))

    await expect(
      analyzeSwing(chunkChallenge(), 'p', CODE, 'fail', 3)
    ).rejects.toThrow('overloaded')
  })
})

describe('analysis schemas', () => {
  it('has no spoiler fields in the hint schema', () => {
    expect(Object.keys(HINT_ANALYSIS_SCHEMA.shape)).toEqual([
      'summary',
      'detail',
    ])
  })
})
