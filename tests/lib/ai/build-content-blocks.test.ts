import { describe, it, expect } from 'vitest'
import { buildAnthropicMessages } from '@/lib/ai/build-content-blocks'
import type { ValidatedMessage } from '@/lib/ai/validate-chat-request'

describe('buildAnthropicMessages', () => {
  it('returns plain string content for text-only user messages', () => {
    const messages: ValidatedMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'How are you?' },
    ]
    const result = buildAnthropicMessages(messages)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ role: 'user', content: 'Hello' })
    expect(result[1]).toEqual({ role: 'assistant', content: 'Hi there' })
    expect(typeof result[2].content).toBe('string')
  })

  it('builds DocumentBlockParam for PDF attachment', () => {
    const messages: ValidatedMessage[] = [
      {
        role: 'user',
        content: 'Review this',
        attachments: [
          {
            type: 'application/pdf',
            data: 'AQID', // base64
            name: 'deck.pdf',
            size: 1024,
          },
        ],
      },
    ]
    const result = buildAnthropicMessages(messages)
    const content = result[0].content

    expect(Array.isArray(content)).toBe(true)
    const blocks = content as unknown[]
    expect(blocks).toHaveLength(2) // document + text

    const docBlock = blocks[0] as Record<string, unknown>
    expect(docBlock.type).toBe('document')
    const source = docBlock.source as Record<string, unknown>
    expect(source.type).toBe('base64')
    expect(source.media_type).toBe('application/pdf')
    expect(source.data).toBe('AQID')
    expect(docBlock.title).toBe('deck.pdf')

    const textBlock = blocks[1] as Record<string, unknown>
    expect(textBlock.type).toBe('text')
    expect(textBlock.text).toBe('Review this')
  })

  it('builds ImageBlockParam for image attachment', () => {
    const messages: ValidatedMessage[] = [
      {
        role: 'user',
        content: 'What is this?',
        attachments: [
          {
            type: 'image/png',
            data: 'iVBORw==',
            name: 'screenshot.png',
            size: 2048,
          },
        ],
      },
    ]
    const result = buildAnthropicMessages(messages)
    const blocks = result[0].content as unknown[]

    const imgBlock = blocks[0] as Record<string, unknown>
    expect(imgBlock.type).toBe('image')
    const source = imgBlock.source as Record<string, unknown>
    expect(source.type).toBe('base64')
    expect(source.media_type).toBe('image/png')
  })

  it('decodes text files to PlainTextSource', () => {
    // "Hello world" in base64
    const base64Text = Buffer.from('Hello world').toString('base64')
    const messages: ValidatedMessage[] = [
      {
        role: 'user',
        content: '',
        attachments: [
          {
            type: 'text/plain',
            data: base64Text,
            name: 'notes.txt',
            size: 11,
          },
        ],
      },
    ]
    const result = buildAnthropicMessages(messages)
    const blocks = result[0].content as unknown[]

    // Only 1 block (document) — empty text is omitted
    expect(blocks).toHaveLength(1)
    const docBlock = blocks[0] as Record<string, unknown>
    expect(docBlock.type).toBe('document')
    const source = docBlock.source as Record<string, unknown>
    expect(source.type).toBe('text')
    expect(source.media_type).toBe('text/plain')
    expect(source.data).toBe('Hello world')
  })

  it('handles text/markdown and text/csv as PlainTextSource', () => {
    const base64 = Buffer.from('# Title').toString('base64')
    const messages: ValidatedMessage[] = [
      {
        role: 'user',
        content: 'Check this',
        attachments: [
          { type: 'text/markdown', data: base64, name: 'doc.md', size: 7 },
        ],
      },
    ]
    const result = buildAnthropicMessages(messages)
    const blocks = result[0].content as unknown[]
    const docBlock = blocks[0] as Record<string, unknown>
    const source = docBlock.source as Record<string, unknown>
    expect(source.type).toBe('text')
    expect(source.data).toBe('# Title')
  })

  it('omits text block when content is empty', () => {
    const messages: ValidatedMessage[] = [
      {
        role: 'user',
        content: '',
        attachments: [
          {
            type: 'application/pdf',
            data: 'AQID',
            name: 'doc.pdf',
            size: 100,
          },
        ],
      },
    ]
    const result = buildAnthropicMessages(messages)
    const blocks = result[0].content as unknown[]
    expect(blocks).toHaveLength(1)
    expect((blocks[0] as Record<string, unknown>).type).toBe('document')
  })

  it('handles multiple attachments in one message', () => {
    const messages: ValidatedMessage[] = [
      {
        role: 'user',
        content: 'Here are my files',
        attachments: [
          {
            type: 'application/pdf',
            data: 'AQID',
            name: 'deck.pdf',
            size: 100,
          },
          {
            type: 'image/jpeg',
            data: '/9j/',
            name: 'photo.jpg',
            size: 200,
          },
        ],
      },
    ]
    const result = buildAnthropicMessages(messages)
    const blocks = result[0].content as unknown[]
    expect(blocks).toHaveLength(3) // pdf + image + text
    expect((blocks[0] as Record<string, unknown>).type).toBe('document')
    expect((blocks[1] as Record<string, unknown>).type).toBe('image')
    expect((blocks[2] as Record<string, unknown>).type).toBe('text')
  })

  it('keeps assistant messages as plain string', () => {
    const messages: ValidatedMessage[] = [
      { role: 'assistant', content: 'I see your document' },
    ]
    const result = buildAnthropicMessages(messages)
    expect(result[0].content).toBe('I see your document')
    expect(typeof result[0].content).toBe('string')
  })
})
