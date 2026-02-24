import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMessage, buildApiMessages } from '@/lib/ai/message-builder'
import type { ChatMessage, FileAttachment } from '@/types/chat'

beforeEach(() => {
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' })
})

// --- Helpers ---

const attachment: FileAttachment = {
  id: 'att-1',
  name: 'deck.pdf',
  type: 'application/pdf',
  size: 1024,
  data: 'JVBERi0xLjQK',
}

function makeMsg(
  role: 'user' | 'assistant',
  content: string,
  attachments?: ChatMessage['attachments']
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    isReport: false,
    timestamp: Date.now(),
    ...(attachments ? { attachments } : {}),
  }
}

// --- Tests ---

describe('createMessage', () => {
  it('creates a message with metadata attachments', () => {
    const meta = [
      { id: 'a1', name: 'f.pdf', type: 'application/pdf' as const, size: 100 },
    ]
    const msg = createMessage('user', 'hello', false, meta)
    expect(msg.attachments).toEqual(meta)
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('hello')
  })

  it('omits attachments when not provided', () => {
    const msg = createMessage('user', 'hello')
    expect(msg.attachments).toBeUndefined()
  })
})

describe('buildApiMessages', () => {
  it('includes trigger as first message', () => {
    const store = new Map<string, FileAttachment>()
    const msg = makeMsg('user', 'Help me')
    const result = buildApiMessages([], msg, 'My project is stuck', store)

    expect(result[0]).toEqual({
      role: 'user',
      content: 'My project is stuck',
    })
  })

  it('builds messages without attachments when store is empty', () => {
    const store = new Map<string, FileAttachment>()
    const history = [makeMsg('user', 'Hi'), makeMsg('assistant', 'Hello')]
    const current = makeMsg('user', 'Thanks')
    const result = buildApiMessages(history, current, 'trigger', store)

    // trigger + 3 messages = 4
    expect(result).toHaveLength(4)
    expect(result[1].attachments).toBeUndefined()
    expect(result[3].attachments).toBeUndefined()
  })

  it('hydrates attachments on the current message from store', () => {
    const store = new Map<string, FileAttachment>([[attachment.id, attachment]])
    const meta = [
      {
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
      },
    ]
    const current = makeMsg('user', 'Review this', meta)
    const result = buildApiMessages([], current, 'trigger', store)

    expect(result[1].attachments).toHaveLength(1)
    expect(result[1].attachments![0]).toEqual({
      type: 'application/pdf',
      data: 'JVBERi0xLjQK',
      name: 'deck.pdf',
      size: 1024,
    })
  })

  it('re-hydrates attachments on earlier messages in multi-turn', () => {
    const store = new Map<string, FileAttachment>([[attachment.id, attachment]])
    const meta = [
      {
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
      },
    ]
    const history = [
      makeMsg('user', 'Review this', meta),
      makeMsg('assistant', 'I see the PDF'),
    ]
    // Second message has no new attachments
    const current = makeMsg('user', 'What do you think?')
    const result = buildApiMessages(history, current, 'trigger', store)

    // trigger + 3 messages = 4
    expect(result).toHaveLength(4)
    // First user message (index 1) should have hydrated attachment
    expect(result[1].attachments).toHaveLength(1)
    expect(result[1].attachments![0].data).toBe('JVBERi0xLjQK')
    // Current message (index 3) has no attachments
    expect(result[3].attachments).toBeUndefined()
  })

  it('skips attachments whose data is missing from store', () => {
    // Store is empty — attachment data was never stored (e.g., loaded conversation)
    const store = new Map<string, FileAttachment>()
    const meta = [
      {
        id: 'missing-id',
        name: 'old.pdf',
        type: 'application/pdf' as const,
        size: 500,
      },
    ]
    const current = makeMsg('user', 'Review this', meta)
    const result = buildApiMessages([], current, 'trigger', store)

    // Attachment metadata exists but no data → no attachments in API payload
    expect(result[1].attachments).toBeUndefined()
  })

  it('handles multiple attachments across multiple messages', () => {
    const att2: FileAttachment = {
      id: 'att-2',
      name: 'screenshot.png',
      type: 'image/png',
      size: 2048,
      data: 'iVBORw0KGgo=',
    }
    const store = new Map<string, FileAttachment>([
      [attachment.id, attachment],
      [att2.id, att2],
    ])

    const meta1 = [
      {
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
      },
    ]
    const meta2 = [
      { id: att2.id, name: att2.name, type: att2.type, size: att2.size },
    ]

    const history = [
      makeMsg('user', 'Here is the PDF', meta1),
      makeMsg('assistant', 'Got it'),
    ]
    const current = makeMsg('user', 'And a screenshot', meta2)
    const result = buildApiMessages(history, current, 'trigger', store)

    expect(result[1].attachments).toHaveLength(1)
    expect(result[1].attachments![0].name).toBe('deck.pdf')
    expect(result[3].attachments).toHaveLength(1)
    expect(result[3].attachments![0].name).toBe('screenshot.png')
  })
})
