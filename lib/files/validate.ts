import { ALLOWED_FILE_TYPES, type AllowedFileType } from '@/types/chat'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_MESSAGE,
} from '@/lib/constants/chat'

export type FileValidationError =
  | 'invalid_type'
  | 'file_too_large'
  | 'too_many_files'
  | 'read_error'

export interface FileValidationResult {
  ok: boolean
  error?: FileValidationError
  fileName?: string
}

export function isAllowedFileType(
  mimeType: string
): mimeType is AllowedFileType {
  return (ALLOWED_FILE_TYPES as readonly string[]).includes(mimeType)
}

export function validateFile(file: File): FileValidationResult {
  if (!isAllowedFileType(file.type)) {
    return { ok: false, error: 'invalid_type', fileName: file.name }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'file_too_large', fileName: file.name }
  }
  return { ok: true }
}

export function validateFileCount(
  currentCount: number,
  newCount: number
): FileValidationResult {
  if (currentCount + newCount > MAX_FILES_PER_MESSAGE) {
    return { ok: false, error: 'too_many_files' }
  }
  return { ok: true }
}
