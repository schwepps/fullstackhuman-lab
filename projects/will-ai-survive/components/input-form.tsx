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
  isBusy: boolean
}

export function InputForm({ onSubmit, isBusy }: InputFormProps) {
  const [situation, setSituation] = useState('')
  const [error, setError] = useState<string | null>(null)

  const charCount = situation.trim().length
  const isValid =
    charCount >= MIN_SITUATION_LENGTH && charCount <= MAX_SITUATION_LENGTH

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = situationSchema.safeParse(situation)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }
    setError(null)
    onSubmit(parsed.data)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="notch-16 max-w-3xl border-2 border-ink bg-card"
    >
      <div className="pixel flex items-center gap-2.5 bg-ink px-4 py-2.5 text-signal">
        New invite
      </div>
      <div className="px-4 pt-4 pb-5 lg:px-7 lg:pt-6 lg:pb-7">
        <InviteRow label="To" value="AI, temporary replacement for you" />
        <InviteRow label="When" value="Monday 9:00, until it quits" />

        <label htmlFor="situation" className="mt-4 mb-2 block font-semibold">
          Agenda: what is your job really like?
        </label>
        <textarea
          id="situation"
          value={situation}
          onChange={(e) => {
            setSituation(e.target.value)
            setError(null)
          }}
          placeholder="My manager replies-all to every email with just 'noted'…"
          rows={5}
          maxLength={MAX_SITUATION_LENGTH + 100}
          aria-describedby="situation-help"
          className="min-h-30 w-full resize-y border-2 border-ink bg-paper px-3.5 py-3 text-base leading-normal text-ink placeholder:text-ink-muted"
        />
        <p
          id="situation-help"
          className={`mt-1.5 flex justify-between text-sm ${error ? 'text-magenta' : 'text-ink-muted'}`}
        >
          <span>
            {error ??
              (charCount < MIN_SITUATION_LENGTH
                ? `${MIN_SITUATION_LENGTH - charCount} more characters needed`
                : 'Ready to send')}
          </span>
          <span className="font-mono">
            {charCount}/{MAX_SITUATION_LENGTH}
          </span>
        </p>

        <div
          className="my-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Example jobs"
        >
          {EXAMPLE_SCENARIOS.map((scenario) => (
            <button
              key={scenario.label}
              type="button"
              aria-pressed={situation === scenario.text}
              onClick={() => {
                setSituation(scenario.text)
                setError(null)
              }}
              className="min-h-11 touch-manipulation border-2 border-ink bg-card px-3.5 text-[0.9375rem] text-ink aria-pressed:bg-ink aria-pressed:text-signal"
            >
              {scenario.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!isValid || isBusy}
          className="notch-8 pixel flex min-h-14 w-full touch-manipulation items-center justify-center bg-magenta text-sm text-paper active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isBusy ? 'The AI is at work' : 'Send the invite'}
        </button>
      </div>
    </form>
  )
}

function InviteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 border-b border-grid-line py-2">
      <span className="pixel pt-0.5 text-xs text-ink-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}
