'use client'

import { useState, useCallback, useRef } from 'react'
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_PATTERN } from '@/lib/constants'

interface SubmitScoreProps {
  sessionId: string
  displayName: string | null
  onDisplayNameChange: (name: string) => void
  completedCount: number
}

export function SubmitScore({
  sessionId,
  displayName,
  onDisplayNameChange,
  completedCount,
}: SubmitScoreProps) {
  const [name, setName] = useState(displayName ?? '')
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const isSubmittingRef = useRef(false)

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || isSubmittingRef.current) return

    isSubmittingRef.current = true
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, displayName: trimmed }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Submission failed')
      }

      onDisplayNameChange(trimmed)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit score'
      )
    } finally {
      isSubmittingRef.current = false
    }
  }, [name, sessionId, onDisplayNameChange])

  if (completedCount === 0) return null

  if (status === 'success') {
    return (
      <div className="terminal-border p-3 sm:p-4 border-primary/40">
        <div className="text-sm text-primary terminal-text-glow text-center">
          SCORE SUBMITTED
        </div>
      </div>
    )
  }

  const trimmed = name.trim()
  const isValidName =
    trimmed.length >= 1 &&
    trimmed.length <= DISPLAY_NAME_MAX_LENGTH &&
    DISPLAY_NAME_PATTERN.test(trimmed)

  return (
    <div className="terminal-border p-3 sm:p-4">
      <div className="text-xs text-accent uppercase tracking-widest mb-3">
        SUBMIT TO LEADERBOARD
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your callsign..."
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          disabled={status === 'submitting'}
          className="flex-1 bg-transparent border border-border px-3 py-2 text-sm text-primary
                     placeholder:text-muted-foreground focus:outline-none focus:border-primary/60
                     disabled:opacity-40"
        />
        <button
          onClick={handleSubmit}
          disabled={!isValidName || status === 'submitting'}
          className="btn-terminal px-4 py-2 text-sm whitespace-nowrap disabled:opacity-40"
        >
          {status === 'submitting' ? 'SENDING...' : 'SUBMIT'}
        </button>
      </div>
      {status === 'error' && (
        <div className="mt-2 text-xs text-destructive">{errorMessage}</div>
      )}
    </div>
  )
}
