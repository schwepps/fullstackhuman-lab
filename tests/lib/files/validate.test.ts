import { describe, it, expect } from 'vitest'
import {
  isAllowedFileType,
  validateFile,
  validateFileCount,
  validateTotalSize,
} from '@/lib/files/validate'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_MESSAGE,
  MAX_TOTAL_ATTACHMENT_BYTES,
  FILE_INPUT_ACCEPT,
} from '@/lib/constants/chat'
import { ALLOWED_FILE_TYPES } from '@/types/chat'

describe('isAllowedFileType', () => {
  it('accepts allowed MIME types', () => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'text/markdown',
      'text/csv',
    ]
    for (const type of allowed) {
      expect(isAllowedFileType(type)).toBe(true)
    }
  })

  it('rejects disallowed MIME types', () => {
    const rejected = [
      'application/zip',
      'application/javascript',
      'text/html',
      'image/gif',
      'video/mp4',
      'application/octet-stream',
      '',
    ]
    for (const type of rejected) {
      expect(isAllowedFileType(type)).toBe(false)
    }
  })
})

describe('validateFile', () => {
  function makeFile(name: string, type: string, size: number): File {
    const content = new ArrayBuffer(size)
    return new File([content], name, { type })
  }

  it('accepts valid PDF', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    expect(validateFile(file)).toEqual({ ok: true })
  })

  it('accepts valid image', () => {
    const file = makeFile('photo.png', 'image/png', 2048)
    expect(validateFile(file)).toEqual({ ok: true })
  })

  it('accepts file at exactly MAX_FILE_SIZE_BYTES', () => {
    const file = makeFile('big.pdf', 'application/pdf', MAX_FILE_SIZE_BYTES)
    expect(validateFile(file)).toEqual({ ok: true })
  })

  it('rejects file exceeding size limit', () => {
    const file = makeFile(
      'huge.pdf',
      'application/pdf',
      MAX_FILE_SIZE_BYTES + 1
    )
    const result = validateFile(file)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('file_too_large')
    expect(result.fileName).toBe('huge.pdf')
  })

  it('rejects invalid file type', () => {
    const file = makeFile('script.js', 'application/javascript', 100)
    const result = validateFile(file)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('invalid_type')
    expect(result.fileName).toBe('script.js')
  })
})

describe('FILE_INPUT_ACCEPT parity with ALLOWED_FILE_TYPES', () => {
  /** Map of MIME types to their file extensions used in the accept string */
  const MIME_TO_EXTENSIONS: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/webp': ['.webp'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'text/csv': ['.csv'],
  }

  it('FILE_INPUT_ACCEPT covers every ALLOWED_FILE_TYPES entry', () => {
    const acceptExtensions = FILE_INPUT_ACCEPT.split(',')
    for (const mimeType of ALLOWED_FILE_TYPES) {
      const expectedExts = MIME_TO_EXTENSIONS[mimeType]
      expect(expectedExts).toBeDefined()
      for (const ext of expectedExts!) {
        expect(acceptExtensions).toContain(ext)
      }
    }
  })

  it('FILE_INPUT_ACCEPT has no extra extensions beyond ALLOWED_FILE_TYPES', () => {
    const acceptExtensions = FILE_INPUT_ACCEPT.split(',')
    const allExpectedExts = Object.values(MIME_TO_EXTENSIONS).flat()
    for (const ext of acceptExtensions) {
      expect(allExpectedExts).toContain(ext)
    }
  })
})

describe('validateFileCount', () => {
  it('accepts files within limit', () => {
    expect(validateFileCount(0, 1)).toEqual({ ok: true })
    expect(validateFileCount(2, 3)).toEqual({ ok: true })
    expect(validateFileCount(0, MAX_FILES_PER_MESSAGE)).toEqual({ ok: true })
  })

  it('rejects files exceeding limit', () => {
    const result = validateFileCount(3, 3)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('too_many_files')
  })

  it('rejects when already at limit', () => {
    const result = validateFileCount(MAX_FILES_PER_MESSAGE, 1)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('too_many_files')
  })
})

describe('validateTotalSize', () => {
  it('accepts files within total limit', () => {
    expect(validateTotalSize(0, 1024)).toEqual({ ok: true })
    expect(validateTotalSize(10 * 1024 * 1024, 5 * 1024 * 1024)).toEqual({
      ok: true,
    })
  })

  it('accepts files at exactly the limit', () => {
    expect(validateTotalSize(MAX_TOTAL_ATTACHMENT_BYTES - 100, 100)).toEqual({
      ok: true,
    })
  })

  it('rejects when total would exceed limit', () => {
    const result = validateTotalSize(MAX_TOTAL_ATTACHMENT_BYTES, 1)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('total_size_exceeded')
  })

  it('rejects when single file exceeds remaining budget', () => {
    const result = validateTotalSize(MAX_TOTAL_ATTACHMENT_BYTES - 100, 101)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('total_size_exceeded')
  })
})
