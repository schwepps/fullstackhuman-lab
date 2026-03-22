'use client'

import { useState, useCallback } from 'react'
import { BASE_PATH } from '@/lib/constants'
import type { RoundMessage } from '@/lib/types'

interface VoteFormProps {
  roomCode: string
  sessionId: string
  messages: RoundMessage[]
  onVoted: () => void
}

export function VoteForm({
  roomCode,
  sessionId,
  messages,
  onVoted,
}: VoteFormProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otherMessages = messages.filter((m) => m.sessionId !== sessionId)

  const handleVote = useCallback(
    async (votedForSessionId: string) => {
      if (isVoting || voted) return
      setIsVoting(true)
      setError(null)

      try {
        const res = await fetch(`${BASE_PATH}/api/room/${roomCode}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, votedForSessionId }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to vote')
        }

        setVoted(true)
        onVoted()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to vote')
      } finally {
        setIsVoting(false)
      }
    },
    [roomCode, sessionId, isVoting, voted, onVoted]
  )

  if (voted) {
    return (
      <div className="card p-4 text-center">
        <p className="text-sm font-semibold text-primary">Vote recorded!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Waiting for other players to vote...
        </p>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
        Vote — Whose Evidence Was Most Convincing?
      </h3>

      {error && (
        <p className="mb-3 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {otherMessages.map((msg) => (
          <button
            key={msg.sessionId}
            type="button"
            onClick={() => handleVote(msg.sessionId)}
            disabled={isVoting}
            className="card card-hover w-full p-3 text-left touch-manipulation"
          >
            <p className="text-sm font-semibold text-primary">
              {msg.playerName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {msg.generatedContent.slice(0, 100)}...
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
