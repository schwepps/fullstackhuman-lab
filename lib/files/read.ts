import type { FileAttachment, AllowedFileType } from '@/types/chat'
import { isAllowedFileType } from '@/lib/files/validate'
import { READ_TIMEOUT_MS } from '@/lib/constants/chat'

export class FileReadTimeoutError extends Error {
  constructor(fileName: string) {
    super(`Timeout reading file: ${fileName}`)
    this.name = 'FileReadTimeoutError'
  }
}

export function readFileAsBase64(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    if (!isAllowedFileType(file.type)) {
      reject(new Error(`Unsupported file type: ${file.type}`))
      return
    }

    // Capture narrowed type before async callback
    const validatedType: AllowedFileType = file.type

    const reader = new FileReader()

    const timeout = setTimeout(() => {
      reader.abort()
      reject(new FileReadTimeoutError(file.name))
    }, READ_TIMEOUT_MS)

    const cleanup = () => clearTimeout(timeout)

    reader.onload = () => {
      cleanup()
      const result = reader.result as string
      // Strip the data:...;base64, prefix
      const base64 = result.split(',')[1]
      if (!base64) {
        reject(new Error(`Empty file content: ${file.name}`))
        return
      }
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: validatedType,
        size: file.size,
        data: base64,
      })
    }
    reader.onerror = () => {
      cleanup()
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    reader.onabort = () => {
      cleanup()
      reject(new Error(`File read aborted: ${file.name}`))
    }
    reader.readAsDataURL(file)
  })
}
