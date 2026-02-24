import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileAsBase64 } from '@/lib/files/read'
import { READ_TIMEOUT_MS } from '@/lib/constants/chat'

// --- FileReader mock ---

type ReaderHandler =
  | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
  | null

let lastInstance: MockFileReader | null

class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ReaderHandler = null
  onerror: ReaderHandler = null
  onabort: ReaderHandler = null
  abort = vi.fn()

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastInstance = this
  }

  readAsDataURL() {
    // No-op — tests trigger events manually via lastInstance
  }
}

function triggerLoad(result: string) {
  if (!lastInstance) throw new Error('No FileReader instance')
  lastInstance.result = result
  lastInstance.onload?.call(
    lastInstance as unknown as FileReader,
    new ProgressEvent('load')
  )
}

function triggerError() {
  if (!lastInstance) throw new Error('No FileReader instance')
  lastInstance.onerror?.call(
    lastInstance as unknown as FileReader,
    new ProgressEvent('error')
  )
}

function triggerAbort() {
  if (!lastInstance) throw new Error('No FileReader instance')
  lastInstance.onabort?.call(
    lastInstance as unknown as FileReader,
    new ProgressEvent('abort')
  )
}

beforeEach(() => {
  lastInstance = null
  vi.stubGlobal('FileReader', MockFileReader)
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function makeFile(name: string, type: string, size: number): File {
  return new File([new ArrayBuffer(size)], name, { type })
}

// --- Tests ---

describe('readFileAsBase64', () => {
  it('resolves with valid FileAttachment for supported file', async () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    const promise = readFileAsBase64(file)

    triggerLoad('data:application/pdf;base64,JVBERi0xLjQK')

    const result = await promise
    expect(result).toEqual({
      id: 'test-uuid-1234',
      name: 'doc.pdf',
      type: 'application/pdf',
      size: 1024,
      data: 'JVBERi0xLjQK',
    })
  })

  it('rejects for unsupported file type', async () => {
    const file = makeFile('script.js', 'application/javascript', 100)
    await expect(readFileAsBase64(file)).rejects.toThrow(
      'Unsupported file type: application/javascript'
    )
  })

  it('rejects when FileReader fires onerror', async () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    const promise = readFileAsBase64(file)

    triggerError()

    await expect(promise).rejects.toThrow('Failed to read file: doc.pdf')
  })

  it('rejects when FileReader fires onabort', async () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    const promise = readFileAsBase64(file)

    triggerAbort()

    await expect(promise).rejects.toThrow('File read aborted: doc.pdf')
  })

  it('rejects on timeout', async () => {
    vi.useFakeTimers()

    const file = makeFile('huge.pdf', 'application/pdf', 5_000_000)
    const promise = readFileAsBase64(file)

    vi.advanceTimersByTime(READ_TIMEOUT_MS)

    await expect(promise).rejects.toThrow('Timeout reading file: huge.pdf')
    expect(lastInstance?.abort).toHaveBeenCalled()
  })

  it('rejects when base64 content is empty', async () => {
    const file = makeFile('empty.pdf', 'application/pdf', 0)
    const promise = readFileAsBase64(file)

    triggerLoad('data:application/pdf;base64,')

    await expect(promise).rejects.toThrow('Empty file content: empty.pdf')
  })

  it('rejects when data URL has no comma separator', async () => {
    const file = makeFile('weird.pdf', 'application/pdf', 100)
    const promise = readFileAsBase64(file)

    triggerLoad('malformed-data-url-no-comma')

    await expect(promise).rejects.toThrow('Empty file content: weird.pdf')
  })
})
