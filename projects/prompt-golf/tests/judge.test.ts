import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChallenge, isCodeChallenge } from '../lib/challenges'
import { ModelRefusalError } from '../lib/claude-client'
import { JUDGE_CALL } from '../lib/constants'
import { judgeCode, JUDGE_VERDICT_SCHEMA } from '../lib/judge'
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

const VALID_CODE = `function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}`

describe('judgeCode', () => {
  beforeEach(() => {
    callStructured.mockReset()
  })

  it('returns the structured verdict from the judge model', async () => {
    const verdict = {
      pass: true,
      testResults: [{ case: 'basic', pass: true, reasoning: 'chunks of 2' }],
      summary: 'Correct.',
    }
    callStructured.mockResolvedValue(verdict)

    await expect(judgeCode(chunkChallenge(), VALID_CODE)).resolves.toEqual(
      verdict
    )
    expect(callStructured).toHaveBeenCalledWith(
      JUDGE_CALL,
      expect.any(String),
      expect.stringContaining(VALID_CODE),
      JUDGE_VERDICT_SCHEMA
    )
  })

  it('skips the model when structural checks fail', async () => {
    const verdict = await judgeCode(chunkChallenge(), 'const x = 1')

    expect(verdict.pass).toBe(false)
    expect(callStructured).not.toHaveBeenCalled()
  })

  it('fails the swing with a clear reason when the judge refuses', async () => {
    callStructured.mockRejectedValue(new ModelRefusalError('general_harms'))

    const verdict = await judgeCode(chunkChallenge(), VALID_CODE)

    expect(verdict.pass).toBe(false)
    expect(verdict.summary).toMatch(/declined/i)
  })

  it('lets other API failures reach the route', async () => {
    callStructured.mockRejectedValue(new Error('overloaded'))

    await expect(judgeCode(chunkChallenge(), VALID_CODE)).rejects.toThrow(
      'overloaded'
    )
  })
})

describe('JUDGE_VERDICT_SCHEMA', () => {
  it('rejects a verdict without test results', () => {
    expect(
      JUDGE_VERDICT_SCHEMA.safeParse({ pass: true, summary: 'ok' }).success
    ).toBe(false)
  })
})
