'use client'

import { useState, useEffect, useRef } from 'react'
import { VOTE_TIMEOUT_MS } from '@/lib/game/constants'
import type { LobbyPlayer } from '@/lib/game/types'

type VotePanelProps = {
  candidates: LobbyPlayer[]
  myPlayerId: string
  onVote: (targetId: string) => void
  voteCount: number
  totalVoters: number
  voteStartedAt: number
}

export function VotePanel({
  candidates,
  myPlayerId,
  onVote,
  voteCount,
  totalVoters,
  voteStartedAt,
}: VotePanelProps) {
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(
    Math.floor(VOTE_TIMEOUT_MS / 1000)
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const update = () => {
      const elapsed = Math.floor((Date.now() - voteStartedAt) / 1000)
      const remaining = Math.max(
        0,
        Math.floor(VOTE_TIMEOUT_MS / 1000) - elapsed
      )
      setSecondsLeft(remaining)
    }
    update()
    intervalRef.current = setInterval(update, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [voteStartedAt])

  const handleVote = (targetId: string) => {
    if (votedFor) return
    setVotedFor(targetId)
    onVote(targetId)
  }

  const isUrgent = secondsLeft < 10
  const votableList = candidates.filter((c) => c.id !== myPlayerId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4">
      <div className="w-full max-w-md space-y-4 border border-border bg-background p-4 font-mono sm:p-6">
        <div className="border-t border-primary pt-3">
          <h2 className="text-lg font-bold text-primary">
            {'> SELECT_TARGET'}
          </h2>
        </div>

        {/* Timer */}
        <div
          className={`text-center text-2xl font-bold ${
            isUrgent ? 'animate-pulse text-destructive' : 'text-warning'
          }`}
        >
          T-{secondsLeft}s
        </div>

        {/* Vote progress */}
        <p className="text-center text-sm text-warning">
          VOTES: {voteCount} / {totalVoters}
        </p>

        {/* Player list */}
        <div className="space-y-2">
          {votableList.map((c) => {
            const isSelected = votedFor === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleVote(c.id)}
                disabled={votedFor != null}
                className={`flex h-11 w-full touch-manipulation items-center gap-3 border px-4 text-base transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-accent bg-popover text-accent'
                    : votedFor
                      ? 'border-border bg-background text-muted-foreground opacity-50'
                      : 'border-primary bg-popover text-foreground hover:shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: `#${c.avatarColor.toString(16).padStart(6, '0')}`,
                  }}
                />
                <span>{c.displayName}</span>
              </button>
            )
          })}
        </div>

        {votedFor && (
          <p className="text-center text-sm font-bold text-accent">
            {'VOTE_CAST ✓'}
          </p>
        )}
      </div>
    </div>
  )
}
