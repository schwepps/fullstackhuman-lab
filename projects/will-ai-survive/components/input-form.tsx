'use client'

import { useState } from 'react'
import { situationSchema } from '@/lib/validation'
import {
  EXAMPLE_SCENARIOS,
  MIN_SITUATION_LENGTH,
  MAX_SITUATION_LENGTH,
} from '@/lib/constants'

type InputFormProps = {
  onSubmit: (situation: string) => void
  isLoading?: boolean
  loadingMessage?: string
}

export function InputForm({
  onSubmit,
  isLoading,
  loadingMessage,
}: InputFormProps) {
  const [situation, setSituation] = useState('')
  const [error, setError] = useState<string | null>(null)

  const trimmed = situation.trim()
  const charCount = trimmed.length
  const isValid = charCount >= MIN_SITUATION_LENGTH
  const isOverLimit = charCount > MAX_SITUATION_LENGTH

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const parsed = situationSchema.safeParse(situation)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    onSubmit(parsed.data)
  }

  function handleChipClick(scenario: string) {
    setSituation(scenario)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Textarea */}
      <div className="flex flex-col gap-2">
        <label htmlFor="situation" className="sr-only">
          Describe your workplace situation
        </label>
        <textarea
          id="situation"
          value={situation}
          onChange={(e) => {
            setSituation(e.target.value)
            setError(null)
          }}
          placeholder="My manager schedules 2-hour standups where everyone reports what they had for breakfast..."
          rows={5}
          maxLength={MAX_SITUATION_LENGTH + 100}
          disabled={isLoading}
          className="card w-full resize-none p-4 font-mono text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-corporate/30 disabled:opacity-50"
        />

        {/* Character count */}
        <div className="flex items-center justify-between px-1 text-xs">
          {error ? (
            <span className="text-danger">{error}</span>
          ) : (
            <span className="text-muted-foreground">
              {charCount < MIN_SITUATION_LENGTH
                ? `${MIN_SITUATION_LENGTH - charCount} more characters needed`
                : 'Ready to deploy'}
            </span>
          )}
          <span
            className={`font-mono ${isOverLimit ? 'text-danger' : 'text-muted-foreground'}`}
          >
            {charCount}/{MAX_SITUATION_LENGTH}
          </span>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Or try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              type="button"
              onClick={() => handleChipClick(scenario)}
              disabled={isLoading}
              className="card-dim min-h-11 touch-manipulation px-3 py-2.5 text-left text-xs transition-colors hover:bg-surface-dim/80 active:scale-[0.98] disabled:opacity-50"
            >
              {scenario.length > 60 ? scenario.slice(0, 60) + '...' : scenario}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isOverLimit || isLoading}
        className="btn-corporate w-full"
      >
        {isLoading
          ? (loadingMessage ?? 'Evaluating...')
          : '> Deploy AI to This Job'}
      </button>
    </form>
  )
}
