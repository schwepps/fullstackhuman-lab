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
      {/* Report-style card container */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="h-0.75 w-full bg-accent" />
        <div className="px-5 py-5 sm:px-6">
          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
            Incident Description
          </p>

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
            className="w-full resize-none rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />

          {/* Character count */}
          <div className="mt-2 flex items-center justify-between text-xs">
            {error ? (
              <span className="text-accent">{error}</span>
            ) : (
              <span className="text-muted-foreground">
                {charCount < MIN_SITUATION_LENGTH
                  ? `${MIN_SITUATION_LENGTH - charCount} more characters needed`
                  : 'Ready to deploy'}
              </span>
            )}
            <span
              className={`font-mono ${isOverLimit ? 'text-accent' : 'text-muted-foreground'}`}
            >
              {charCount}/{MAX_SITUATION_LENGTH}
            </span>
          </div>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-col gap-2">
        <p className="px-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
          Or try an example
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              type="button"
              onClick={() => handleChipClick(scenario)}
              disabled={isLoading}
              className="min-h-11 touch-manipulation rounded-md border border-border bg-surface px-3 py-2.5 text-left text-xs text-foreground/80 shadow-sm transition-all hover:border-muted hover:shadow-md active:scale-[0.98] disabled:opacity-50"
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
        className="min-h-12 w-full cursor-pointer touch-manipulation rounded-lg bg-accent px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:hover:shadow-none"
      >
        {isLoading
          ? (loadingMessage ?? 'Evaluating...')
          : 'Deploy AI to your job'}
      </button>
    </form>
  )
}
