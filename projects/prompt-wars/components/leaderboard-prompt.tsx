'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from '@/hooks/use-session'
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_PATTERN } from '@/lib/constants'
import { postLeaderboard, LeaderboardError } from '@/lib/leaderboard-client'

export function LeaderboardPrompt() {
  const {
    state: session,
    isLeaderboardJoined,
    joinLeaderboard,
    updateLeaderboardSync,
    resetLeaderboard,
  } = useSession()

  const [name, setName] = useState(session.displayName ?? '')
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'syncing' | 'synced' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const isSubmittingRef = useRef(false)

  // Auto-sync for already-joined users
  useEffect(() => {
    if (!isLeaderboardJoined || !session.displayName) return
    if (isSubmittingRef.current) return

    let cancelled = false
    isSubmittingRef.current = true
    setStatus('syncing')

    async function sync() {
      try {
        const { totalScore: synced } = await postLeaderboard(
          session.sessionId,
          session.displayName!
        )
        if (!cancelled) {
          updateLeaderboardSync(synced)
          setStatus('synced')
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof LeaderboardError && err.status === 403) {
            resetLeaderboard()
          }
          setStatus('idle')
        }
      } finally {
        isSubmittingRef.current = false
      }
    }

    sync()
    return () => {
      cancelled = true
    }
    // Run once on mount for joined users
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoin = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || isSubmittingRef.current) return

    isSubmittingRef.current = true
    setStatus('submitting')
    setErrorMessage('')

    try {
      const { totalScore: synced } = await postLeaderboard(
        session.sessionId,
        trimmed
      )
      joinLeaderboard(trimmed, synced)
      setStatus('synced')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      )
    } finally {
      isSubmittingRef.current = false
    }
  }, [name, session.sessionId, joinLeaderboard])

  // Already joined — show sync status
  if (isLeaderboardJoined) {
    return (
      <div className="terminal-border border-primary/30 p-3 flex items-center gap-2">
        <span className="text-primary text-xs">{'>'}</span>
        <span className="text-sm text-muted-foreground">
          {status === 'syncing' ? (
            <span className="animate-pulse">Syncing leaderboard...</span>
          ) : (
            <>
              On the leaderboard as{' '}
              <span className="text-primary">{session.displayName}</span>
            </>
          )}
        </span>
      </div>
    )
  }

  // Just joined via this component — show confirmation
  if (status === 'synced') {
    return (
      <div className="terminal-border border-primary/30 p-3 flex items-center gap-2">
        <span className="text-primary text-xs">{'>'}</span>
        <span className="text-sm text-muted-foreground">
          On the leaderboard as{' '}
          <span className="text-primary">{name.trim()}</span>
        </span>
      </div>
    )
  }

  // Not joined — show join form
  const trimmed = name.trim()
  const isValidName =
    trimmed.length >= 1 &&
    trimmed.length <= DISPLAY_NAME_MAX_LENGTH &&
    DISPLAY_NAME_PATTERN.test(trimmed)

  return (
    <div className="terminal-border p-3 sm:p-4">
      <div className="text-xs text-accent uppercase tracking-widest mb-1">
        Leaderboard
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        Rank among other hackers
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValidName) handleJoin()
          }}
          placeholder="Enter callsign..."
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          disabled={status === 'submitting'}
          className="flex-1 bg-transparent border border-border px-3 py-2 text-sm text-primary
                     placeholder:text-muted-foreground focus:outline-none focus:border-primary/60
                     disabled:opacity-40"
        />
        <button
          onClick={handleJoin}
          disabled={!isValidName || status === 'submitting'}
          className="btn-terminal px-4 py-2 text-sm whitespace-nowrap disabled:opacity-40"
        >
          {status === 'submitting' ? 'JOINING...' : 'JOIN'}
        </button>
      </div>
      {status === 'error' && (
        <div className="mt-2 text-xs text-destructive">{errorMessage}</div>
      )}
    </div>
  )
}
