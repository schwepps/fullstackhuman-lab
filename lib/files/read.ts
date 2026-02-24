import type { FileAttachment, AllowedFileType } from '@/types/chat'
import { isAllowedFileType } from '@/lib/files/validate'

export function readFileAsBase64(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    if (!isAllowedFileType(file.type)) {
      reject(new Error(`Unsupported file type: ${file.type}`))
      return
    }

    // Capture narrowed type before async callback
    const validatedType: AllowedFileType = file.type

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data:...;base64, prefix
      const base64 = result.split(',')[1]
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: validatedType,
        size: file.size,
        data: base64,
      })
    }
    reader.onerror = () =>
      reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsDataURL(file)
  })
}
