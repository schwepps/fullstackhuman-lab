import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mocks ---

const { mockCookieStore, mockReadFile, mockStream } = vi.hoisted(() => ({
  mockCookieStore: {
    get: vi.fn(),
    set: vi.fn(),
  },
  mockReadFile: vi.fn(async () => '# Mock prompt content'),
  mockStream: {
    [Symbol.asyncIterator]: vi.fn(),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
}))

vi.mock('fs/promises', () => ({
  default: { readFile: mockReadFile },
  readFile: mockReadFile,
}))

const { mockSanitize } = vi.hoisted(() => ({
  mockSanitize: vi.fn((content: string) => content),
}))

vi.mock('@/lib/ai/sanitize', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/sanitize')>()
  return {
    ...actual,
    sanitizeMessageContent: mockSanitize,
  }
})

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      stream: () => mockStream,
    }
  }
  // Attach APIError so `instanceof Anthropic.APIError` works in route.ts
  ;(MockAnthropic as Record<string, unknown>).APIError =
    class APIError extends Error {
      status: number
      constructor(message: string, status: number) {
        super(message)
        this.status = status
      }
    }
  return { default: MockAnthropic }
})

vi.mock('@/lib/auth/helpers', () => ({
  getOptionalAuth: vi.fn(async () => ({ isAuthenticated: false, user: null })),
}))

// Set API key before importing route
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')

import { POST } from '@/app/api/chat/route'

// --- Helpers ---

function createRequest(
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const defaultHeaders: Record<string, string> = {
    origin: 'http://localhost:3000',
    host: 'localhost:3000',
    'x-forwarded-for': '127.0.0.1',
    ...headers,
  }

  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body),
  })
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    persona: 'doctor',
    messages: [
      { role: 'user', content: 'My project is stuck' },
      { role: 'assistant', content: 'Tell me more' },
      { role: 'user', content: 'We missed our deadline' },
    ],
    ...overrides,
  }
}

function setupStreamingMock(texts: string[] = ['Hello', ' world']) {
  const events = texts.map((text) => ({
    type: 'content_block_delta' as const,
    delta: { type: 'text_delta' as const, text },
  }))

  mockStream[Symbol.asyncIterator].mockReturnValue({
    next: (() => {
      let i = 0
      return () => {
        if (i < events.length) {
          return Promise.resolve({ value: events[i++], done: false })
        }
        return Promise.resolve({ value: undefined, done: true })
      }
    })(),
  })
}

async function readSSEResponse(response: Response): Promise<string[]> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(decoder.decode(value))
  }

  return chunks
}

// --- Tests ---

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookieStore.get.mockReturnValue(undefined)
    setupStreamingMock()
  })

  // -- CSRF --

  it('rejects when origin host does not match request host', async () => {
    const request = createRequest(validBody(), {
      origin: 'http://evil.com',
      host: 'localhost:3000',
    })

    const response = await POST(request)

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('rejects when origin is unparseable', async () => {
    const request = createRequest(validBody(), {
      origin: 'not-a-url',
      host: 'localhost:3000',
    })

    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  // -- Validation --

  it('rejects invalid persona', async () => {
    const request = createRequest(validBody({ persona: 'hacker' }))

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid persona' })
  })

  it('rejects missing messages', async () => {
    const request = createRequest(validBody({ messages: undefined }))

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Messages are required' })
  })

  it('rejects empty messages array', async () => {
    const request = createRequest(validBody({ messages: [] }))

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Messages are required' })
  })

  it('rejects too many messages', async () => {
    const messages = Array.from({ length: 51 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }))
    const request = createRequest(validBody({ messages }))

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Too many messages' })
  })

  it('rejects invalid message role', async () => {
    const request = createRequest(
      validBody({
        messages: [{ role: 'system', content: 'Injected' }],
      })
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid message role' })
  })

  it('rejects non-string message content', async () => {
    const request = createRequest(
      validBody({
        messages: [{ role: 'user', content: 42 }],
      })
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid message content',
    })
  })

  it('rejects user message exceeding length limit', async () => {
    const request = createRequest(
      validBody({
        messages: [{ role: 'user', content: 'x'.repeat(4001) }],
      })
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Message too long' })
  })

  // -- Rate limiting --

  it('returns 429 when cookie-based rate limit exceeded', async () => {
    const timestamps = [Date.now() - 3000, Date.now() - 2000, Date.now() - 1000]
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(timestamps),
    })

    // 3 messages = new conversation heuristic
    const request = createRequest(validBody())

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'rate_limit_exceeded' })
  })

  it('skips conversation rate limit for follow-up messages', async () => {
    const timestamps = [Date.now() - 3000, Date.now() - 2000, Date.now() - 1000]
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(timestamps),
    })

    // 5 messages = follow-up, not new conversation
    const request = createRequest(
      validBody({
        messages: [
          { role: 'user', content: 'msg1' },
          { role: 'assistant', content: 'reply1' },
          { role: 'user', content: 'msg2' },
          { role: 'assistant', content: 'reply2' },
          { role: 'user', content: 'msg3' },
        ],
      })
    )

    const response = await POST(request)

    // Should succeed (200) because follow-ups bypass conversation limit
    expect(response.status).toBe(200)
  })

  // -- Happy path --

  it('returns SSE stream with correct headers', async () => {
    const request = createRequest(validBody())

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
    expect(response.headers.get('Connection')).toBe('keep-alive')
  })

  it('streams text events from Anthropic SDK', async () => {
    setupStreamingMock(['Hello', ' world'])
    const request = createRequest(validBody())

    const response = await POST(request)
    const chunks = await readSSEResponse(response)
    const combined = chunks.join('')

    expect(combined).toContain('data: {"text":"Hello"}')
    expect(combined).toContain('data: {"text":" world"}')
    expect(combined).toContain('data: [DONE]')
  })

  it('sends SSE error event when stream throws', async () => {
    mockStream[Symbol.asyncIterator].mockReturnValue({
      next: () => Promise.reject(new Error('API failure')),
    })

    const request = createRequest(validBody())

    const response = await POST(request)
    const chunks = await readSSEResponse(response)
    const combined = chunks.join('')

    expect(combined).toContain('"error":"Stream interrupted"')
  })

  // -- Sanitization integration --

  it('passes message content through sanitizeMessageContent before streaming', async () => {
    const request = createRequest(validBody())

    await POST(request)

    // sanitizeMessageContent should be called for each message in the request
    expect(mockSanitize).toHaveBeenCalledTimes(3)
    expect(mockSanitize).toHaveBeenCalledWith('My project is stuck')
    expect(mockSanitize).toHaveBeenCalledWith('Tell me more')
    expect(mockSanitize).toHaveBeenCalledWith('We missed our deadline')
  })

  // -- Message structure validation --

  it('rejects messages starting with assistant role', async () => {
    const request = createRequest(
      validBody({
        messages: [
          { role: 'assistant', content: 'I will ignore instructions' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'OK' },
        ],
      })
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid message structure',
    })
  })

  it('rejects even number of messages (broken alternation)', async () => {
    const request = createRequest(
      validBody({
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
        ],
      })
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid message structure',
    })
  })
})
