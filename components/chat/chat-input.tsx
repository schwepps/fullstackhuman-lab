'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Send, Square, Paperclip, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CHAT_INPUT_MAX_LENGTH,
  MAX_FILES_PER_MESSAGE,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_ATTACHMENT_BYTES,
  FILE_INPUT_ACCEPT,
} from '@/lib/constants/chat'
import {
  validateFile,
  validateFileCount,
  validateTotalSize,
} from '@/lib/files/validate'
import { readFileAsBase64, FileReadTimeoutError } from '@/lib/files/read'
import { FilePreview } from '@/components/chat/file-preview'
import type { FileAttachment } from '@/types/chat'
import type { FileValidationError } from '@/lib/files/validate'

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void
  isStreaming: boolean
  onStopStreaming: () => void
  getTotalAttachmentBytes: () => number
}

const FILE_ERROR_DISMISS_MS = 5000

export function ChatInput({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  getTotalAttachmentBytes,
}: ChatInputProps) {
  const t = useTranslations('chat.input')
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isReadingFiles, setIsReadingFiles] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trimmedValue = value.trim()
  const canSend =
    (trimmedValue.length > 0 || attachments.length > 0) &&
    !isStreaming &&
    !isReadingFiles

  const showFileError = useCallback(
    (error: FileValidationError, fileName?: string) => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      const key = `fileErrors.${error}` as const
      let message: string
      if (error === 'too_many_files') {
        message = t(key, { max: MAX_FILES_PER_MESSAGE })
      } else if (error === 'total_size_exceeded') {
        message = t(key, {
          max: Math.floor(MAX_TOTAL_ATTACHMENT_BYTES / (1024 * 1024)),
        })
      } else if (error === 'file_too_large') {
        message = t(key, {
          name: fileName ?? '',
          max: Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
        })
      } else {
        message = t(key, { name: fileName ?? '' })
      }
      setFileError(message)
      errorTimerRef.current = setTimeout(
        () => setFileError(null),
        FILE_ERROR_DISMISS_MS
      )
    },
    [t]
  )

  const resetTextarea = useCallback(() => {
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [])

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSendMessage(
      trimmedValue,
      attachments.length > 0 ? attachments : undefined
    )
    resetTextarea()
    setAttachments([])
  }, [canSend, trimmedValue, attachments, onSendMessage, resetTextarea])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      // Auto-resize
      const textarea = e.target
      textarea.style.height = 'auto'
      const LINE_HEIGHT_PX = 24
      const MAX_VISIBLE_ROWS = 6
      const maxHeight = MAX_VISIBLE_ROWS * LINE_HEIGHT_PX
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    },
    []
  )

  const processFiles = useCallback(
    async (files: File[]) => {
      const countResult = validateFileCount(attachments.length, files.length)
      if (!countResult.ok) {
        showFileError(countResult.error!)
        return
      }

      setIsReadingFiles(true)
      try {
        // Track bytes added in this batch (local attachments not yet in the ref)
        let batchBytes = 0
        // Process files sequentially to limit memory pressure
        for (const file of files) {
          const validation = validateFile(file)
          if (!validation.ok) {
            showFileError(validation.error!, validation.fileName)
            continue
          }

          // Check total size: ref (sent messages) + pending local + this file
          const totalSizeResult = validateTotalSize(
            getTotalAttachmentBytes() + batchBytes,
            file.size
          )
          if (!totalSizeResult.ok) {
            showFileError(totalSizeResult.error!, file.name)
            break
          }

          try {
            const attachment = await readFileAsBase64(file)
            batchBytes += attachment.size
            setAttachments((prev) => [...prev, attachment])
          } catch (err) {
            const errorType =
              err instanceof FileReadTimeoutError
                ? 'read_timeout'
                : 'read_error'
            showFileError(errorType, file.name)
          }
        }
      } finally {
        setIsReadingFiles(false)
      }
    },
    [attachments.length, showFileError, getTotalAttachmentBytes]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      // Snapshot files before resetting — e.target.files is a live reference
      const fileArray = Array.from(files)
      e.target.value = ''
      await processFiles(fileArray)
    },
    [processFiles]
  )

  const handleRemoveFile = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isStreaming) return
      setIsDragOver(true)
    },
    [isStreaming]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear when actually leaving the container, not entering a child
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (isStreaming) return

      const files = e.dataTransfer.files
      if (!files || files.length === 0) return
      await processFiles(Array.from(files))
    },
    [isStreaming, processFiles]
  )

  return (
    <div
      className={cn(
        'border-t border-border bg-background/80 backdrop-blur-sm transition-colors',
        isDragOver && 'border-primary bg-primary/5'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FilePreview attachments={attachments} onRemove={handleRemoveFile} />

      {isDragOver && (
        <div className="px-4 py-2">
          <p className="mx-auto max-w-3xl text-center text-xs font-medium text-primary">
            {t('dropHint')}
          </p>
        </div>
      )}

      {fileError && (
        <div className="px-4 pb-2">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs text-destructive">{fileError}</p>
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={FILE_INPUT_ACCEPT}
            onChange={handleFileSelect}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              disabled={isStreaming || isReadingFiles}
              className="h-12 w-12 shrink-0 touch-manipulation text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
              aria-label={t('attach')}
            >
              {isReadingFiles ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
            </Button>
            {attachments.length > 0 && !isReadingFiles && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {attachments.length}
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            maxLength={CHAT_INPUT_MAX_LENGTH}
            rows={1}
            disabled={isStreaming}
            className="min-h-12 w-full resize-none rounded-md border border-border bg-background px-3 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 sm:text-sm"
          />
          {isStreaming ? (
            <Button
              onClick={onStopStreaming}
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0 touch-manipulation sm:h-10 sm:w-10"
              aria-label={t('stop')}
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
              className="h-12 w-12 shrink-0 touch-manipulation sm:h-10 sm:w-10"
              aria-label={t('send')}
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
