import { parseSection } from './section-schemas'
import type { SSEEvent } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Validates one server event with the same schemas the server parsed it with. */
export function toSSEEvent(type: string, data: unknown): SSEEvent | null {
  if (!isRecord(data)) return null
  if (type === 'complete') {
    return typeof data.id === 'string' ? { type, data: { id: data.id } } : null
  }
  if (type === 'error') {
    return typeof data.message === 'string'
      ? { type, data: { message: data.message } }
      : null
  }
  const section = parseSection(type, data)
  // Same shapes the server emits from these sections
  return section
    ? ({ type: section.name, data: section.data } as SSEEvent)
    : null
}

/** Returns a push(chunk) function that calls onEvent for each complete SSE event. */
export function createSSEReader(onEvent: (event: SSEEvent) => void) {
  let buffer = ''
  let eventType = ''
  let eventData = ''

  return function push(chunk: string) {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        eventData = line.slice(6)
      } else if (line === '') {
        if (eventType && eventData) emit(eventType, eventData)
        eventType = ''
        eventData = ''
      }
    }
  }

  function emit(type: string, raw: string) {
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      return
    }
    const event = toSSEEvent(type, data)
    if (event) onEvent(event)
  }
}
