import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const { mockStream, mockReadFile } = vi.hoisted(() => ({
  mockStream: {
    finalMessage: vi.fn(),
  },
  mockReadFile: vi.fn(async () => '# Mock prompt content'),
}))

vi.mock('fs/promises', () => ({
  default: { readFile: mockReadFile },
  readFile: mockReadFile,
}))

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      stream: () => mockStream,
    }
  }
  return { default: MockAnthropic }
})

vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')

import { callAI } from '@/lib/telegram/services/ai-service'

// --- Tests ---

describe('callAI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns text from a single text block', async () => {
    mockStream.finalMessage.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello from Claude' }],
      usage: { server_tool_use: null },
    })

    const result = await callAI({
      systemBlocks: [{ type: 'text', text: 'system' }],
      messages: [{ role: 'user', content: 'hi' }],
    })

    expect(result).toBe('Hello from Claude')
  })

  it('joins text from multiple text blocks with interleaved search results', async () => {
    mockStream.finalMessage.mockResolvedValue({
      content: [
        {
          type: 'server_tool_use',
          id: 'tool_1',
          name: 'web_search',
          input: { query: 'claude cowork' },
        },
        {
          type: 'web_search_tool_result',
          tool_use_id: 'tool_1',
          content: [{ type: 'web_search_result', url: 'https://example.com' }],
        },
        { type: 'text', text: 'Based on my research, ' },
        {
          type: 'server_tool_use',
          id: 'tool_2',
          name: 'web_search',
          input: { query: 'claude cowork features' },
        },
        {
          type: 'web_search_tool_result',
          tool_use_id: 'tool_2',
          content: [{ type: 'web_search_result', url: 'https://example.com' }],
        },
        { type: 'text', text: 'here is what I found.' },
      ],
      usage: { server_tool_use: { web_search_requests: 2 } },
    })

    const result = await callAI({
      systemBlocks: [{ type: 'text', text: 'system' }],
      messages: [{ role: 'user', content: 'What is Claude Cowork?' }],
    })

    expect(result).toBe('Based on my research, here is what I found.')
  })

  it('returns null when all blocks are non-text', async () => {
    mockStream.finalMessage.mockResolvedValue({
      content: [
        {
          type: 'web_search_tool_result',
          tool_use_id: 'tool_1',
          content: [],
        },
      ],
      usage: { server_tool_use: { web_search_requests: 1 } },
    })

    const result = await callAI({
      systemBlocks: [{ type: 'text', text: 'system' }],
      messages: [{ role: 'user', content: 'hi' }],
    })

    expect(result).toBeNull()
  })

  it('returns null on API error', async () => {
    mockStream.finalMessage.mockRejectedValue(new Error('API timeout'))

    const result = await callAI({
      systemBlocks: [{ type: 'text', text: 'system' }],
      messages: [{ role: 'user', content: 'hi' }],
    })

    expect(result).toBeNull()
  })
})
