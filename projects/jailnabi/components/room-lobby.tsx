'use client'

import { useState } from 'react'
import type { Room, Player } from '@/lib/types'
import type { AISkill } from '@/lib/types'
import { BASE_PATH, MIN_PLAYERS, MAX_PLAYERS } from '@/lib/constants'

interface RoomLobbyProps {
  room: Room
  players: Player[]
  skill: AISkill | null
  sessionId: string
  onGameStarted: () => void
}

export function RoomLobby({
  room,
  players,
  skill,
  sessionId,
  onGameStarted,
}: RoomLobbyProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCreator = room.creatorSessionId === sessionId
  const canStart = players.length >= MIN_PLAYERS
  const roomUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${BASE_PATH}/room/${room.code}`

  async function handleStart() {
    if (!isCreator || isStarting) return
    setIsStarting(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_PATH}/api/room/${room.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to start')
      }

      onGameStarted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start')
    } finally {
      setIsStarting(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(roomUrl)
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Room code */}
      <div className="card mb-6 p-6 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Room Code
        </p>
        <p className="mt-1 font-mono text-4xl font-black tracking-widest text-primary">
          {room.code}
        </p>
        <button
          type="button"
          onClick={handleCopyLink}
          className="btn btn-secondary mt-3 text-xs"
        >
          Copy Invite Link
        </button>
      </div>

      {/* Crime */}
      <div className="card mb-4 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          The Crime
        </p>
        <p className="mt-1 font-semibold">&ldquo;{room.crime}&rdquo;</p>
      </div>

      {/* AI Skill */}
      {skill && (
        <div className="card mb-4 border-primary bg-primary-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Skill: {skill.name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{skill.tip}</p>
        </div>
      )}

      {/* Players */}
      <div className="card mb-4 p-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          Players ({players.length}/{MAX_PLAYERS})
        </p>
        <div className="space-y-2">
          {players.map((player, i) => (
            <div
              key={player.sessionId}
              className="flex items-center gap-2 text-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover font-bold text-primary">
                {player.name[0].toUpperCase()}
              </span>
              <span className="font-medium">{player.name}</span>
              {i === 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-background">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>

        {players.length < MIN_PLAYERS && (
          <p className="mt-3 text-xs text-muted-foreground">
            Need at least {MIN_PLAYERS} players to start
          </p>
        )}
      </div>

      {/* Start button (creator only) */}
      {isCreator && (
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="btn btn-danger w-full text-lg"
        >
          {isStarting
            ? 'Starting...'
            : !canStart
              ? `Waiting for players (${players.length}/${MIN_PLAYERS})`
              : 'Start Game'}
        </button>
      )}

      {!isCreator && (
        <div className="card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Waiting for {room.creatorName} to start the game...
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-center text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
