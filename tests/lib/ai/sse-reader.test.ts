import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  readSSEStream,
  StreamInactivityError,
  type SSEEvent,
  type SSEReaderOptions,
} from '@/lib/ai/sse-reader'

function createMockResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  let index = 0

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]))
        index++
      } else {
        controller.close()
      }
    },
  })

  return new Response(stream)
}

function createDelayedResponse(chunks: string[], delayMs: number): Response {
  const encoder = new TextEncoder()
  let index = 0

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        controller.enqueue(encoder.encode(chunks[index]))
        index++
      } else {
        controller.close()
      }
    },
  })

  return new Response(stream)
}

async function collectEvents(
  response: Response,
  options?: SSEReaderOptions
): Promise<SSEEvent[]> {
  const events: SSEEvent[] = []
  for await (const event of readSSEStream(response, options)) {
    events.push(event)
  }
  return events
}

describe('readSSEStream', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('parses a single SSE event with text field', async () => {
    const response = createMockResponse(['data: {"text":"Hello"}\n\n'])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'Hello' }])
  })

  it('parses multiple events from a single chunk', async () => {
    const response = createMockResponse([
      'data: {"text":"Hello"}\n\ndata: {"text":" world"}\n\n',
    ])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'Hello' }, { text: ' world' }])
  })

  it('handles events split across multiple chunks', async () => {
    const response = createMockResponse(['data: {"tex', 't":"split"}\n\n'])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'split' }])
  })

  it('skips [DONE] sentinel without yielding', async () => {
    const response = createMockResponse([
      'data: {"text":"Hello"}\n\ndata: [DONE]\n\n',
    ])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'Hello' }])
  })

  it('skips non-data lines', async () => {
    const response = createMockResponse([
      ':comment\nretry: 1000\ndata: {"text":"real"}\n\n',
    ])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'real' }])
  })

  it('skips empty lines', async () => {
    const response = createMockResponse([
      '\n\ndata: {"text":"after blanks"}\n\n',
    ])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'after blanks' }])
  })

  it('skips malformed JSON gracefully', async () => {
    const response = createMockResponse([
      'data: {not json}\n\ndata: {"text":"valid"}\n\n',
    ])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'valid' }])
  })

  it('yields error events from stream', async () => {
    const response = createMockResponse([
      'data: {"error":"Stream interrupted"}\n\n',
    ])

    const events = await collectEvents(response)

    expect(events).toEqual([{ error: 'Stream interrupted' }])
  })

  it('throws when response has no body', async () => {
    const response = new Response(null)

    await expect(collectEvents(response)).rejects.toThrow('No response body')
  })

  it('processes remaining buffered data after stream ends', async () => {
    // Last chunk doesn't end with newline — data sits in buffer
    const response = createMockResponse(['data: {"text":"buffered"}'])

    const events = await collectEvents(response)

    expect(events).toEqual([{ text: 'buffered' }])
  })

  it('works normally without timeout option', async () => {
    const response = createMockResponse([
      'data: {"text":"a"}\n\ndata: {"text":"b"}\n\n',
    ])

    const events = await collectEvents(response, undefined)

    expect(events).toEqual([{ text: 'a' }, { text: 'b' }])
  })

  it('completes when data arrives within timeout', async () => {
    const response = createDelayedResponse(['data: {"text":"ok"}\n\n'], 10)

    const events = await collectEvents(response, {
      inactivityTimeoutMs: 500,
    })

    expect(events).toEqual([{ text: 'ok' }])
  })

  it('throws StreamInactivityError when stream stalls', async () => {
    // Create a response whose reader.read() never resolves (hangs forever)
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        // Return a promise that never resolves — simulates a stalled connection
        return new Promise(() => {})
      },
    })
    const response = new Response(stream)

    await expect(
      collectEvents(response, { inactivityTimeoutMs: 100 })
    ).rejects.toThrow(StreamInactivityError)
  })

  it('resets timeout on each chunk', async () => {
    // Each chunk arrives after 30ms, timeout is 100ms
    // All chunks should be received since each resets the timer
    const response = createDelayedResponse(
      [
        'data: {"text":"a"}\n\n',
        'data: {"text":"b"}\n\n',
        'data: {"text":"c"}\n\n',
      ],
      30
    )

    const events = await collectEvents(response, {
      inactivityTimeoutMs: 100,
    })

    expect(events).toEqual([{ text: 'a' }, { text: 'b' }, { text: 'c' }])
  })
})
