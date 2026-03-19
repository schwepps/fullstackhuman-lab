'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_PATTERN } from '@/lib/constants'
import { postLeaderboard, LeaderboardError } from '@/lib/leaderboard-client'

interface LeaderboardStatusProps {
  sessionId: string
  displayName: string | null
  totalScore: number
  completedCount: number
  isLeaderboardJoined: boolean
  isLeaderboardStale: boolean
  onJoinLeaderboard: (name: string, syncedScore: number) => void
  onUpdateLeaderboardSync: (syncedScore: number) => void
  onResetLeaderboard: () => void
  onDisplayNameChange: (name: string) => void
}

export function LeaderboardStatus({
  sessionId,
  displayName,
  totalScore,
  completedCount,
  isLeaderboardJoined,
  isLeaderboardStale,
  onJoinLeaderboard,
  onUpdateLeaderboardSync,
  onResetLeaderboard,
  onDisplayNameChange,
}: LeaderboardStatusProps) {
  const [name, setName] = useState(displayName ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'syncing' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const isSubmittingRef = useRef(false)
  const syncFailedRef = useRef(false)

  // Reset sync failure flag when score changes (new level beaten)
  const prevScoreRef = useRef(totalScore)
  useEffect(() => {
    if (totalScore !== prevScoreRef.current) {
      syncFailedRef.current = false
      prevScoreRef.current = totalScore
    }
  }, [totalScore])

  // Auto-sync when score is stale (new level beaten since last sync)
  useEffect(() => {
    if (!isLeaderboardJoined || !isLeaderboardStale || !displayName) return
    if (isSubmittingRef.current || syncFailedRef.current) return

    let cancelled = false
    isSubmittingRef.current = true
    setStatus('syncing')

    async function sync() {
      try {
        const { totalScore: synced } = await postLeaderboard(
          sessionId,
          displayName!
        )
        if (!cancelled) {
          onUpdateLeaderboardSync(synced)
          setStatus('idle')
        }
      } catch (err) {
        if (!cancelled) {
          // 403 = server wins expired/deleted — reset local leaderboard state
          if (err instanceof LeaderboardError && err.status === 403) {
            onResetLeaderboard()
          }
          syncFailedRef.current = true
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
  }, [
    isLeaderboardJoined,
    isLeaderboardStale,
    sessionId,
    displayName,
    onUpdateLeaderboardSync,
    onResetLeaderboard,
  ])

  const handleJoin = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || isSubmittingRef.current) return

    isSubmittingRef.current = true
    setStatus('submitting')
    setErrorMessage('')

    try {
      const { totalScore: synced } = await postLeaderboard(sessionId, trimmed)
      onJoinLeaderboard(trimmed, synced)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      )
    } finally {
      isSubmittingRef.current = false
    }
  }, [name, sessionId, onJoinLeaderboard])

  const handleUpdateCallsign = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed || isSubmittingRef.current) return

    isSubmittingRef.current = true
    setStatus('submitting')
    setErrorMessage('')

    try {
      const { totalScore: synced } = await postLeaderboard(sessionId, trimmed)
      onDisplayNameChange(trimmed)
      onUpdateLeaderboardSync(synced)
      setIsEditing(false)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      )
    } finally {
      isSubmittingRef.current = false
    }
  }, [name, sessionId, onDisplayNameChange, onUpdateLeaderboardSync])

  if (completedCount === 0) return null

  const trimmed = name.trim()
  const isValidName =
    trimmed.length >= 1 &&
    trimmed.length <= DISPLAY_NAME_MAX_LENGTH &&
    DISPLAY_NAME_PATTERN.test(trimmed)

  // Not joined — show join form
  if (!isLeaderboardJoined) {
    return (
      <div className="terminal-border p-3 sm:p-4">
        <div className="text-xs text-accent uppercase tracking-widest mb-3">
          JOIN LEADERBOARD
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValidName) handleJoin()
            }}
            placeholder="Enter your callsign..."
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

  // Joined — show status with optional callsign edit
  return (
    <div className="terminal-border p-3 sm:p-4 border-primary/40">
      {isEditing ? (
        <>
          <div className="text-xs text-accent uppercase tracking-widest mb-3">
            EDIT CALLSIGN
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              disabled={status === 'submitting'}
              className="flex-1 bg-transparent border border-border px-3 py-2 text-sm text-primary
                         focus:outline-none focus:border-primary/60 disabled:opacity-40"
            />
            <button
              onClick={handleUpdateCallsign}
              disabled={!isValidName || status === 'submitting'}
              className="btn-terminal px-4 py-2 text-sm whitespace-nowrap disabled:opacity-40"
            >
              {status === 'submitting' ? 'SAVING...' : 'SAVE'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setName(displayName ?? '')
                setErrorMessage('')
              }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation px-2"
            >
              CANCEL
            </button>
          </div>
          {status === 'error' && (
            <div className="mt-2 text-xs text-destructive">{errorMessage}</div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-accent">LEADERBOARD:</span>{' '}
            <span className="text-primary">{displayName}</span>
            <span className="text-muted-foreground"> — </span>
            <span className="text-primary terminal-text-glow">
              {totalScore}pts
            </span>
            {status === 'syncing' && (
              <span className="text-muted-foreground ml-2 animate-pulse">
                syncing...
              </span>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation"
          >
            EDIT
          </button>
        </div>
      )}
    </div>
  )
}
