import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SSEEvent } from '@/lib/types'

const streamMock = vi.hoisted(() => ({
  chunks: [] as string[],
  stopReason: 'end_turn' as string,
}))

vi.mock('@anthropic-ai/sdk', () => {
  class FakeStream {
    private textListeners: Array<(text: string) => void> = []
    on(event: string, listener: (text: string) => void) {
      if (event === 'text') this.textListeners.push(listener)
      return this
    }
    async finalMessage() {
      streamMock.chunks.forEach((chunk) =>
        this.textListeners.forEach((l) => l(chunk))
      )
      return {
        model: 'claude-sonnet-5-5',
        stop_reason: streamMock.stopReason,
        usage: { input_tokens: 1, output_tokens: 1, iterations: null },
      }
    }
  }
  class Anthropic {
    static APIError = class extends Error {}
    static RateLimitError = class extends Error {}
    beta = { messages: { stream: () => new FakeStream() } }
  }
  return { default: Anthropic }
})

vi.mock('@/lib/result-store', () => ({
  saveResult: vi.fn().mockResolvedValue(undefined),
  incrementStats: vi.fn().mockResolvedValue(undefined),
}))

const FULL_OUTPUT = [
  '<chaos_rating>{"chaosRating": 7, "chaosLabel": "L", "survivalDuration": "2 days"}</chaos_rating>',
  '<timeline_entry>{"time": "Day 1", "event": "E", "sanityLevel": "50%"}</timeline_entry>',
  '<breaking_point>{"breakingPoint": "B"}</breaking_point>',
  '<resignation>{"resignationLetter": "R", "oneLineSummary": "S"}</resignation>',
]

async function collect(stream: ReadableStream<SSEEvent>): Promise<SSEEvent[]> {
  const events: SSEEvent[] = []
  const reader = stream.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return events
    events.push(value)
  }
}

describe('createEvaluationStream', () => {
  beforeEach(() => {
    streamMock.chunks = FULL_OUTPUT
    streamMock.stopReason = 'end_turn'
  })

  it('emits complete after all sections on a normal end of turn', async () => {
    const { createEvaluationStream } = await import('@/lib/evaluator')

    const events = await collect(createEvaluationStream('my job'))

    expect(events.map((e) => e.type)).toEqual([
      'chaos_rating',
      'timeline_entry',
      'breaking_point',
      'resignation',
      'complete',
    ])
  })

  it('ends with exactly one error and closes when the model refuses', async () => {
    streamMock.chunks = []
    streamMock.stopReason = 'refusal'
    const { createEvaluationStream } = await import('@/lib/evaluator')

    const events = await collect(createEvaluationStream('my job'))

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('error')
  })

  it('drops a malformed section without failing the evaluation', async () => {
    streamMock.chunks = [
      ...FULL_OUTPUT,
      '<timeline_entry>{not json}</timeline_entry>',
    ]
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { createEvaluationStream } = await import('@/lib/evaluator')

    const events = await collect(createEvaluationStream('my job'))

    expect(events.at(-1)?.type).toBe('complete')
    expect(info).toHaveBeenCalledWith(
      'Evaluation usage:',
      expect.objectContaining({ droppedSections: 1, fallbackRan: false })
    )
    warn.mockRestore()
    info.mockRestore()
  })

  it('still completes when the stats counter fails', async () => {
    const { incrementStats } = await import('@/lib/result-store')
    vi.mocked(incrementStats).mockRejectedValueOnce(new Error('redis down'))
    const { createEvaluationStream } = await import('@/lib/evaluator')

    const events = await collect(createEvaluationStream('my job'))

    expect(events.at(-1)?.type).toBe('complete')
  })

  it('reports a cut-off output as incomplete even if sections arrived', async () => {
    streamMock.stopReason = 'max_tokens'
    const { createEvaluationStream } = await import('@/lib/evaluator')

    const events = await collect(createEvaluationStream('my job'))

    const last = events.at(-1)
    expect(last?.type).toBe('error')
    expect(events.some((e) => e.type === 'complete')).toBe(false)
  })
})
