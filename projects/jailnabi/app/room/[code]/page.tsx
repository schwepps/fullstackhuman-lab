'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { useRoom } from '@/hooks/use-room'
import { RoomLobby } from '@/components/room-lobby'
import { GameBoard } from '@/components/game-board'
import { VoteForm } from '@/components/vote-form'
import { VerdictScreen } from '@/components/verdict-screen'
import Link from 'next/link'
import { BASE_PATH, MIN_NAME_LENGTH, MAX_NAME_LENGTH } from '@/lib/constants'

export default function RoomPage() {
  const params = useParams<{ code: string }>()
  const { sessionId, playerName, updateName } = useSession()
  const {
    room,
    players,
    currentRoundMessages,
    currentRoundVotes,
    scores,
    skill,
    aiTip,
    verdict,
    isLoading,
    error,
    refresh,
  } = useRoom(params.code)

  // Join form state for non-members
  const [joinName, setJoinName] = useState(playerName)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="card animate-pulse p-6 text-center">
          <div className="mx-auto h-10 w-40 rounded bg-surface-hover" />
          <div className="mx-auto mt-4 h-6 w-60 rounded bg-surface-hover" />
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="mb-2 font-mono text-4xl font-black text-danger">404</p>
        <p className="mb-4 text-lg text-muted-foreground">
          {error ?? 'Room not found'}
        </p>
        <Link href={`${BASE_PATH}/`} className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    )
  }

  // Check if player is in the room
  const isInRoom = players.some((p) => p.sessionId === sessionId)

  // Join form for players not yet in the room
  if (!isInRoom && room.status === 'lobby') {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="card p-6">
          <div className="mb-4 text-center">
            <p className="font-mono text-2xl font-black tracking-widest text-primary">
              {room.code}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {room.creatorName} created this room
            </p>
          </div>

          <div className="mb-4 card bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              The Crime
            </p>
            <p className="mt-1 font-semibold">&ldquo;{room.crime}&rdquo;</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!joinName.trim() || isJoining) return
              setIsJoining(true)
              setJoinError(null)
              try {
                const res = await fetch(
                  `${BASE_PATH}/api/room/${room.code}/join`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: joinName.trim(),
                      sessionId,
                    }),
                  }
                )
                if (!res.ok) {
                  const data = await res.json()
                  throw new Error(data.error ?? 'Failed to join')
                }
                updateName(joinName.trim())
                refresh()
              } catch (err) {
                setJoinError(
                  err instanceof Error ? err.message : 'Failed to join'
                )
              } finally {
                setIsJoining(false)
              }
            }}
          >
            <label
              htmlFor="join-name"
              className="mb-1 block text-sm font-semibold"
            >
              Your Name
            </label>
            <input
              id="join-name"
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Enter your name"
              maxLength={MAX_NAME_LENGTH}
              className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {joinError && (
              <p className="mb-4 text-xs text-danger" role="alert">
                {joinError}
              </p>
            )}

            <button
              type="submit"
              disabled={joinName.trim().length < MIN_NAME_LENGTH || isJoining}
              className="btn btn-primary w-full"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Too late to join
  if (!isInRoom) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground">
          Game already started. You can&apos;t join mid-game.
        </p>
        <Link href={`${BASE_PATH}/`} className="btn btn-primary mt-4">
          Create Your Own Room
        </Link>
      </div>
    )
  }

  const isCreator = room.creatorSessionId === sessionId
  const allSubmitted = currentRoundMessages.length >= players.length
  const hasVoted = sessionId in currentRoundVotes
  const allVoted = Object.keys(currentRoundVotes).length >= players.length

  // Lobby
  if (room.status === 'lobby') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <RoomLobby
          room={room}
          players={players}
          skill={skill}
          sessionId={sessionId}
          onGameStarted={refresh}
        />
      </div>
    )
  }

  // Finished — show verdict
  if (room.status === 'finished' && verdict) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <VerdictScreen verdict={verdict} crime={room.crime} />
      </div>
    )
  }

  // Playing
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Game board — write messages + see evidence */}
      <GameBoard
        room={room}
        players={players}
        messages={currentRoundMessages}
        scores={scores}
        skill={skill}
        aiTip={aiTip}
        sessionId={sessionId}
        onRefresh={refresh}
      />

      {/* Voting phase — after all submitted */}
      {allSubmitted && !hasVoted && (
        <div className="mt-4">
          <VoteForm
            roomCode={room.code}
            sessionId={sessionId}
            messages={currentRoundMessages}
            onVoted={refresh}
          />
        </div>
      )}

      {/* Score trigger — host only, after all voted */}
      {allSubmitted && allVoted && isCreator && (
        <div className="mt-4">
          <ScoreButton
            roomCode={room.code}
            sessionId={sessionId}
            onScored={refresh}
          />
        </div>
      )}

      {/* Waiting for votes/scoring */}
      {allSubmitted && hasVoted && !allVoted && (
        <div className="mt-4 card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Waiting for all players to vote...
          </p>
        </div>
      )}
    </div>
  )
}

function ScoreButton({
  roomCode,
  sessionId,
  onScored,
}: {
  roomCode: string
  sessionId: string
  onScored: () => void
}) {
  const [isScoring, setIsScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleScore() {
    if (isScoring) return
    setIsScoring(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_PATH}/api/room/${roomCode}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to score')
      }

      onScored()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score')
    } finally {
      setIsScoring(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleScore}
        disabled={isScoring}
        className="btn btn-danger w-full text-lg"
      >
        {isScoring ? 'AI Judge is deliberating...' : 'Score Round & Advance'}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
