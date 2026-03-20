'use client'

import { useState, useCallback } from 'react'
import { BASE_PATH, MAX_CONFESSION_LENGTH } from '@/lib/constants'

interface ConfessionalBoothProps {
  memberId: string
  onConfessed?: () => void
}

export function ConfessionalBooth({
  memberId,
  onConfessed,
}: ConfessionalBoothProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!text.trim() || isSubmitting) return

      setIsSubmitting(true)
      setError(null)

      try {
        const res = await fetch(`${BASE_PATH}/api/confess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId, text: text.trim() }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to submit confession')
        }

        setSubmitted(true)
        onConfessed?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsSubmitting(false)
      }
    },
    [text, memberId, isSubmitting, onConfessed]
  )

  if (submitted) {
    return (
      <div className="card border-accent p-4 text-center">
        <p className="text-sm font-semibold text-accent">
          Confession recorded. Your sentence has been reduced.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card border-accent p-4"
      aria-label="Confessional booth"
    >
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
        Confessional Booth
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Share one TRUE fun fact about yourself to reduce your sentence. Hidden
        talent? Embarrassing work story? Unpopular opinion?
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g., I once replied-all to 500 people with just 'Thanks'"
        maxLength={MAX_CONFESSION_LENGTH}
        rows={2}
        className="mb-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        aria-label="Your confession"
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {text.length}/{MAX_CONFESSION_LENGTH}
        </span>
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="btn bg-accent text-background hover:bg-accent/80"
        >
          {isSubmitting ? 'Confessing...' : 'Confess'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
