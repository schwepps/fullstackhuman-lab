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
      <span className="text-base text-[#94a3b8] sm:text-sm">{'>'}</span>
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
        className="h-11 flex-1 touch-manipulation border border-[#1e293b] bg-[#111118] px-3 text-base text-[#e2e8f0] placeholder-[#94a3b8] transition-colors focus:border-[#22d3ee] focus:shadow-[0_0_8px_rgba(34,211,238,0.15)] focus:outline-none disabled:opacity-40 sm:text-sm"
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  )
}
