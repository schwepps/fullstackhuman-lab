'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Send, Square, Paperclip } from 'lucide-react'
import {
  CHAT_INPUT_MAX_LENGTH,
  MAX_FILES_PER_MESSAGE,
  FILE_INPUT_ACCEPT,
} from '@/lib/constants/chat'
import { validateFile, validateFileCount } from '@/lib/files/validate'
import { readFileAsBase64 } from '@/lib/files/read'
import { FilePreview } from '@/components/chat/file-preview'
import type { FileAttachment } from '@/types/chat'
import type { FileValidationError } from '@/lib/files/validate'

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void
  isStreaming: boolean
  onStopStreaming: () => void
}

const FILE_ERROR_DISMISS_MS = 5000

export function ChatInput({
  onSendMessage,
  isStreaming,
  onStopStreaming,
}: ChatInputProps) {
  const t = useTranslations('chat.input')
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trimmedValue = value.trim()
  const canSend =
    (trimmedValue.length > 0 || attachments.length > 0) && !isStreaming

  const showFileError = useCallback(
    (error: FileValidationError, fileName?: string) => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      const key = `fileErrors.${error}` as const
      const message =
        error === 'too_many_files'
          ? t(key, { max: MAX_FILES_PER_MESSAGE })
          : t(key, { name: fileName ?? '' })
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

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      // Reset file input so the same file can be re-selected
      e.target.value = ''

      const countResult = validateFileCount(attachments.length, files.length)
      if (!countResult.ok) {
        showFileError(countResult.error!)
        return
      }

      // Process files sequentially to limit memory pressure
      for (const file of Array.from(files)) {
        const validation = validateFile(file)
        if (!validation.ok) {
          showFileError(validation.error!, validation.fileName)
          continue
        }

        try {
          const attachment = await readFileAsBase64(file)
          setAttachments((prev) => [...prev, attachment])
        } catch {
          showFileError('read_error', file.name)
        }
      }
    },
    [attachments.length, showFileError]
  )

  const handleRemoveFile = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm">
      <FilePreview attachments={attachments} onRemove={handleRemoveFile} />

      {fileError && (
        <div className="px-4 pb-2">
          <p className="text-xs text-destructive">{fileError}</p>
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
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAttachClick}
            disabled={isStreaming}
            className="h-12 w-12 shrink-0 touch-manipulation text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
            aria-label={t('attach')}
          >
            <Paperclip className="size-4" />
          </Button>
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
