'use client'

import { useState, useEffect, useRef } from 'react'
import { VOTE_TIMEOUT_MS } from '@/lib/game/constants'

type VoteCandidate = {
  id: string
  displayName: string
  avatarColor: number
}

type VotePanelProps = {
  candidates: VoteCandidate[]
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0c]/95 p-4">
      <div className="w-full max-w-md space-y-4 border border-[#1e293b] bg-[#0a0a0c] p-4 font-mono sm:p-6">
        <div className="border-t border-[#22d3ee] pt-3">
          <h2 className="text-lg font-bold text-[#22d3ee]">
            {'> SELECT_TARGET'}
          </h2>
        </div>

        {/* Timer */}
        <div
          className={`text-center text-2xl font-bold ${
            isUrgent ? 'animate-pulse text-[#ef4444]' : 'text-[#f59e0b]'
          }`}
        >
          T-{secondsLeft}s
        </div>

        {/* Vote progress */}
        <p className="text-center text-sm text-[#f59e0b]">
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
                    ? 'border-[#4ade80] bg-[#111118] text-[#4ade80]'
                    : votedFor
                      ? 'border-[#1e293b] bg-[#0a0a0c] text-[#94a3b8] opacity-50'
                      : 'border-[#22d3ee] bg-[#111118] text-[#e2e8f0] hover:shadow-[0_0_8px_rgba(34,211,238,0.15)]'
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
          <p className="text-center text-sm font-bold text-[#4ade80]">
            {'VOTE_CAST ✓'}
          </p>
        )}
      </div>
    </div>
  )
}
