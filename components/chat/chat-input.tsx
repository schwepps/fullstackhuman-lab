'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Send, Square } from 'lucide-react'
import { CHAT_INPUT_MAX_LENGTH } from '@/lib/constants/chat'

interface ChatInputProps {
  onSendMessage: (content: string) => void
  isStreaming: boolean
  onStopStreaming: () => void
}

export function ChatInput({
  onSendMessage,
  isStreaming,
  onStopStreaming,
}: ChatInputProps) {
  const t = useTranslations('chat.input')
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmedValue = value.trim()
  const canSend = trimmedValue.length > 0 && !isStreaming

  const resetTextarea = useCallback(() => {
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [])

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSendMessage(trimmedValue)
    resetTextarea()
  }, [canSend, trimmedValue, onSendMessage, resetTextarea])

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

  return (
    <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
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
  )
}
