export interface SSEEvent {
  text?: string
  error?: string
}

export class StreamInactivityError extends Error {
  constructor() {
    super('Stream inactivity timeout')
    this.name = 'StreamInactivityError'
  }
}

export interface SSEReaderOptions {
  inactivityTimeoutMs?: number
}

export async function* readSSEStream(
  response: Response,
  options?: SSEReaderOptions
): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  const timeoutMs = options?.inactivityTimeoutMs
  let buffer = ''

  try {
    while (true) {
      const { done, value } = timeoutMs
        ? await readWithTimeout(reader, timeoutMs)
        : await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      // Keep the last element — it may be an incomplete line
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          yield JSON.parse(data) as SSEEvent
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    // Flush any remaining bytes from the decoder (incomplete multi-byte chars)
    buffer += decoder.decode()

    // Process any remaining buffered data
    const finalBuffer = buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer
    if (finalBuffer.startsWith('data: ')) {
      const data = finalBuffer.slice(6)
      if (data !== '[DONE]') {
        try {
          yield JSON.parse(data) as SSEEvent
        } catch {
          // Skip malformed final chunk
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {
      // Ignore cancel errors during cleanup
    })
  }
}

async function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new StreamInactivityError())
    }, timeoutMs)
  })

  try {
    return await Promise.race([reader.read(), timeoutPromise])
  } catch (error) {
    // Cancel the in-flight reader.read() immediately on timeout
    reader.cancel().catch(() => {})
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
