'use client'

import { useState, useRef, useCallback } from 'react'
import { MAX_MESSAGE_LENGTH } from '@/lib/game/constants'

type ChatInputProps = {
  onSend: (content: string) => void
  onFocusChange: (focused: boolean) => void
  disabled: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  onFocusChange,
  disabled,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }, [value, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      // Stop WASD propagation when focused
      e.stopPropagation()
    },
    [handleSubmit]
  )

  return (
    <div className="flex w-full items-center gap-1 font-mono lg:max-w-xs">
      <span className="text-base text-muted-foreground sm:text-sm">{'>'}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        disabled={disabled}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={disabled ? 'CHAT_DISABLED' : placeholder}
        className="h-11 flex-1 touch-manipulation border border-border bg-popover px-3 text-base text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:shadow-[0_0_8px_rgba(34,211,238,0.15)] focus:outline-none disabled:opacity-40 sm:text-sm"
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  )
}
