'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MAX_MESSAGE_LENGTH, MESSAGE_COOLDOWN_MS } from '@/lib/game/constants'

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
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const cooldownEndRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Start cooldown countdown after sending a message
  const startCooldown = useCallback(() => {
    const end = Date.now() + MESSAGE_COOLDOWN_MS
    cooldownEndRef.current = end
    setCooldownLeft(MESSAGE_COOLDOWN_MS)
  }, [])

  // Tick the countdown — only runs while cooldown is active
  useEffect(() => {
    if (cooldownLeft <= 0) return
    const id = setInterval(() => {
      const remaining = Math.max(0, cooldownEndRef.current - Date.now())
      setCooldownLeft(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 100)
    return () => clearInterval(id)
  }, [cooldownLeft > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const inCooldown = cooldownLeft > 0

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || inCooldown) return
    onSend(trimmed)
    setValue('')
    startCooldown()
  }, [value, onSend, inCooldown, startCooldown])

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

  const cooldownSeconds = Math.ceil(cooldownLeft / 1000)
  const cooldownPlaceholder = `Wait ${cooldownSeconds}s...`
  const effectiveDisabled = disabled || inCooldown
  const effectivePlaceholder = disabled
    ? 'CHAT_DISABLED'
    : inCooldown
      ? cooldownPlaceholder
      : placeholder

  return (
    <div className="flex w-full items-center gap-1 font-mono">
      <span className="text-base text-muted-foreground sm:text-sm">{'>'}</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        disabled={effectiveDisabled}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={effectivePlaceholder}
        className="h-11 flex-1 touch-manipulation border border-border bg-popover px-3 text-base text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:shadow-[0_0_8px_rgba(34,211,238,0.15)] focus:outline-none disabled:opacity-40 sm:text-sm"
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  )
}
