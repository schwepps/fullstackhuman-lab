'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BASE_PATH } from '@/lib/constants'
import type { Crime } from '@/lib/types'

interface CrimePoolProps {
  memberId: string
  hasActiveRound: boolean
  onRoundStarted?: () => void
}

export function CrimePool({
  memberId,
  hasActiveRound,
  onRoundStarted,
}: CrimePoolProps) {
  const router = useRouter()
  const [crimes, setCrimes] = useState<Crime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchCrimes = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_PATH}/api/crime`)
      if (res.ok) {
        const data = await res.json()
        setCrimes(data)
      }
    } catch {
      // Offline
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrimes()
  }, [fetchCrimes])

  async function handleStartRound(crime: Crime) {
    if (hasActiveRound || startingId) return

    setStartingId(crime.id)
    setError(null)

    try {
      const res = await fetch(`${BASE_PATH}/api/round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crimeId: crime.id,
          startedBy: memberId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to start round')
      }

      const round = await res.json()
      onRoundStarted?.()
      router.push(`${BASE_PATH}/round/${round.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start round')
    } finally {
      setStartingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="card animate-pulse p-4">
        <div className="h-5 w-32 rounded bg-surface-hover" />
        <div className="mt-3 h-12 rounded bg-surface-hover" />
      </div>
    )
  }

  if (crimes.length === 0) {
    return (
      <div className="card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No crimes in the pool yet. Submit one below to get started!
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
        Crime Pool ({crimes.length} available)
      </h3>

      {error && (
        <p className="mb-3 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {crimes.map((crime) => (
          <div
            key={crime.id}
            className="card card-hover flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">&ldquo;{crime.text}&rdquo;</p>
            </div>

            {!hasActiveRound && (
              <button
                type="button"
                onClick={() => handleStartRound(crime)}
                disabled={startingId !== null}
                className="btn btn-primary shrink-0 text-xs"
              >
                {startingId === crime.id ? 'Starting...' : 'Start Round'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
