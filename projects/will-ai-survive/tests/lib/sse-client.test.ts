import { describe, it, expect } from 'vitest'
import { createSSEReader, toSSEEvent } from '@/lib/sse-client'
import type { SSEEvent } from '@/lib/types'

function read(chunks: string[]): SSEEvent[] {
  const events: SSEEvent[] = []
  const push = createSSEReader((event) => events.push(event))
  chunks.forEach(push)
  return events
}

const ENTRY =
  'event: timeline_entry\ndata: {"time":"Day 1","period":2,"event":"E","sanityLevel":"50%"}\n\n'

describe('createSSEReader', () => {
  it('rebuilds an event split across chunks', () => {
    const cut = 30
    const events = read([ENTRY.slice(0, cut), ENTRY.slice(cut)])

    expect(events).toEqual([
      {
        type: 'timeline_entry',
        data: { time: 'Day 1', period: 2, event: 'E', sanityLevel: '50%' },
      },
    ])
  })

  it('reads several events from one chunk and skips malformed ones', () => {
    const events = read([
      'event: error\ndata: {not json}\n\n' +
        ENTRY +
        'event: complete\ndata: {"id":"abc123def456"}\n\n',
    ])

    expect(events.map((e) => e.type)).toEqual(['timeline_entry', 'complete'])
  })
})

describe('toSSEEvent', () => {
  it('keeps the calendar unit on chaos ratings', () => {
    const event = toSSEEvent('chaos_rating', {
      chaosRating: 7,
      chaosLabel: 'L',
      survivalDuration: '4 days',
      calendarUnit: 'day',
    })

    expect(event?.data).toMatchObject({ calendarUnit: 'day' })
  })

  it('rejects unknown event types', () => {
    expect(toSSEEvent('surprise', { a: 1 })).toBeNull()
  })
})
