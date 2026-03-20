'use client'

import { useState, useCallback } from 'react'
import { countWords } from '@/lib/word-counter'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  disabled: boolean
  isPractice: boolean
  par: number
}

export function PromptInput({
  onSubmit,
  disabled,
  isPractice,
  par,
}: PromptInputProps) {
  const [value, setValue] = useState('')
  const wordCount = countWords(value)

  const diff = wordCount - par
  const wordCountColor =
    wordCount === 0
      ? ''
      : diff <= -1
        ? 'border-birdie/40 bg-birdie/10 text-birdie'
        : diff === 0
          ? 'border-par/40 bg-par/10 text-par'
          : 'border-bogey/40 bg-bogey/10 text-bogey'

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled || value.trim().length === 0) return
      onSubmit(value.trim())
    },
    [disabled, value, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={
            isPractice
              ? 'Describe the function in your own words...'
              : 'Describe the function in as few words as possible...'
          }
          className="w-full resize-none rounded-sm border border-border bg-background/60 px-4 py-3 font-sans text-base text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 sm:text-sm"
          rows={3}
          maxLength={500}
          autoFocus={false}
        />

        {/* Word count badge */}
        <div className="absolute bottom-3 right-3">
          <span className={`word-badge ${wordCountColor}`}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
            <span className="text-muted-foreground/80"> / target {par}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={disabled || wordCount < 2}
          className={
            isPractice
              ? 'btn-club w-full sm:w-auto'
              : 'btn-fairway w-full sm:w-auto'
          }
        >
          {disabled ? 'Generating...' : isPractice ? 'Practice' : 'Submit'}
        </button>

        {isPractice && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Practice is free — no score recorded
          </span>
        )}
      </div>
    </form>
  )
}
