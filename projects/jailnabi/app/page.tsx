'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { CreateRoomForm } from '@/components/create-room-form'
import { BASE_PATH, MAX_NAME_LENGTH } from '@/lib/constants'

export default function LandingPage() {
  const { sessionId, playerName, updateName } = useSession()
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState(playerName)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim() || !joinName.trim() || isJoining) return

    setIsJoining(true)
    setJoinError(null)

    try {
      const res = await fetch(
        `${BASE_PATH}/api/room/${joinCode.trim().toUpperCase()}/join`,
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
      router.push(`${BASE_PATH}/room/${joinCode.trim().toUpperCase()}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-5xl font-black tracking-tight text-primary sm:text-6xl">
          JAILNABI
        </h1>
        <p className="text-lg text-muted-foreground">
          Where no one is innocent
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a room, accuse your friends, let AI generate the evidence.
          <br />
          Most guilty player goes to jail.
        </p>
      </div>

      {/* Create room */}
      <section className="mb-8" aria-label="Create a room">
        <CreateRoomForm
          sessionId={sessionId}
          savedName={playerName}
          onNameChange={updateName}
        />
      </section>

      {/* Divider */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          or join a room
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Join room */}
      <section aria-label="Join a room">
        <form onSubmit={handleJoin} className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-primary">Join a Room</h2>

          <div className="mb-4">
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="room-code"
              className="mb-1 block text-sm font-semibold"
            >
              Room Code
            </label>
            <input
              id="room-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="JAIL42"
              maxLength={6}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {joinError && (
            <p className="mb-4 text-xs text-danger" role="alert">
              {joinError}
            </p>
          )}

          <button
            type="submit"
            disabled={!joinCode.trim() || !joinName.trim() || isJoining}
            className="btn btn-secondary w-full"
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </section>
    </div>
  )
}
