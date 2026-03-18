'use client'

import { useState, useRef } from 'react'
import { INPUT_WARNING_THRESHOLD } from '@/lib/constants'

interface TerminalPromptProps {
  maxLength: number
  onSubmit: (prompt: string) => void
  disabled?: boolean
  error?: string | null
  placeholder?: string
}

export function TerminalPrompt({
  maxLength,
  onSubmit,
  disabled = false,
  error,
  placeholder = 'Type your prompt here...',
}: TerminalPromptProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isOverLimit = value.length > maxLength
  const isEmpty = value.trim().length === 0

  function handleSubmit() {
    if (disabled || isEmpty || isOverLimit) return
    onSubmit(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div>
      <div
        className={`terminal-border bg-popover p-3 sm:p-4 ${error ? 'border-destructive/50' : ''}`}
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-primary/60">
          <span className="animate-cursor-blink">{'>'}</span>
          <span>ENTER_PROMPT</span>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none bg-transparent text-primary placeholder:text-muted-foreground
                     focus:outline-none disabled:opacity-40
                     text-base sm:text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-destructive'
                : value.length > maxLength * INPUT_WARNING_THRESHOLD
                  ? 'text-warning'
                  : 'text-muted-foreground'
            }`}
          >
            {value.length}/{maxLength}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Ctrl+Enter to send
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-2 px-3 py-2 border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || isEmpty || isOverLimit}
        className="btn-terminal mt-3 w-full h-12 text-sm sm:text-base"
      >
        {disabled ? 'PROCESSING...' : 'SEND PROMPT'}
      </button>
    </div>
  )
}
