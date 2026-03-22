'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BASE_PATH,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_CRIME_LENGTH,
  MAX_CRIME_LENGTH,
} from '@/lib/constants'

interface CreateRoomFormProps {
  sessionId: string
  savedName: string
  onNameChange: (name: string) => void
}

export function CreateRoomForm({
  sessionId,
  savedName,
  onNameChange,
}: CreateRoomFormProps) {
  const router = useRouter()
  const [name, setName] = useState(savedName)
  const [crime, setCrime] = useState('')
  const [accusation, setAccusation] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid =
    name.trim().length >= MIN_NAME_LENGTH &&
    crime.trim().length >= MIN_CRIME_LENGTH &&
    accusation.trim().length > 0

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isValid || isCreating) return

      setIsCreating(true)
      setError(null)

      try {
        const res = await fetch(`${BASE_PATH}/api/room`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorName: name.trim(),
            sessionId,
            crime: crime.trim(),
            initialAccusation: accusation.trim(),
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to create room')
        }

        const room = await res.json()
        onNameChange(name.trim())
        router.push(`${BASE_PATH}/room/${room.code}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsCreating(false)
      }
    },
    [
      name,
      crime,
      accusation,
      sessionId,
      isValid,
      isCreating,
      onNameChange,
      router,
    ]
  )

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <h2 className="mb-4 text-lg font-bold text-primary">Create a Room</h2>

      {/* Name */}
      <div className="mb-4">
        <label
          htmlFor="creator-name"
          className="mb-1 block text-sm font-semibold"
        >
          Your Name
        </label>
        <input
          id="creator-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={MAX_NAME_LENGTH}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Crime */}
      <div className="mb-4">
        <label
          htmlFor="crime-input"
          className="mb-1 block text-sm font-semibold"
        >
          The Crime
        </label>
        <input
          id="crime-input"
          type="text"
          value={crime}
          onChange={(e) => setCrime(e.target.value)}
          placeholder='e.g., "Booking a meeting at 17:55 on Friday"'
          maxLength={MAX_CRIME_LENGTH}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {crime.trim().length}/{MAX_CRIME_LENGTH}
        </p>
      </div>

      {/* Initial accusation */}
      <div className="mb-4">
        <label
          htmlFor="accusation-input"
          className="mb-1 block text-sm font-semibold"
        >
          Your Opening Accusation
        </label>
        <textarea
          id="accusation-input"
          value={accusation}
          onChange={(e) => setAccusation(e.target.value)}
          placeholder="Write your initial accusation — the AI will generate evidence from it when the game starts"
          rows={2}
          maxLength={MAX_CRIME_LENGTH}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && (
        <p className="mb-4 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isCreating}
        className="btn btn-primary w-full"
      >
        {isCreating ? 'Creating Room...' : 'Create Room'}
      </button>
    </form>
  )
}
