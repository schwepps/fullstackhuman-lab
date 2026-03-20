'use client'

import { useState, useCallback } from 'react'
import { MAX_CRIME_LENGTH, MIN_CRIME_LENGTH, BASE_PATH } from '@/lib/constants'

interface CrimeSubmitFormProps {
  memberId: string
  onSubmitted?: () => void
}

export function CrimeSubmitForm({
  memberId,
  onSubmitted,
}: CrimeSubmitFormProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const trimmedLength = text.trim().length
  const isValid =
    trimmedLength >= MIN_CRIME_LENGTH && trimmedLength <= MAX_CRIME_LENGTH

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isValid || isSubmitting) return

      setIsSubmitting(true)
      setError(null)

      try {
        const res = await fetch(`${BASE_PATH}/api/crime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), submittedBy: memberId }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to submit crime')
        }

        setText('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        onSubmitted?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsSubmitting(false)
      }
    },
    [text, memberId, isValid, isSubmitting, onSubmitted]
  )

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <label htmlFor="crime-input" className="mb-2 block text-sm font-semibold">
        Submit a Crime
      </label>
      <div className="flex gap-2">
        <input
          id="crime-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g., "Booking a meeting at 17:55 on Friday"'
          maxLength={MAX_CRIME_LENGTH}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-describedby="crime-hint"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="btn btn-primary whitespace-nowrap"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
      <p id="crime-hint" className="mt-1 text-xs text-muted-foreground">
        {trimmedLength}/{MAX_CRIME_LENGTH} characters
        {success && (
          <span className="ml-2 text-success" role="status">
            Crime submitted!
          </span>
        )}
      </p>
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
