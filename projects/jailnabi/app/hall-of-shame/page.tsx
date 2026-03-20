'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HallOfShameTable } from '@/components/hall-of-shame-table'
import { BASE_PATH } from '@/lib/constants'
import type { LeaderboardEntry } from '@/lib/types'

interface LeaderboardData {
  mostConvicted: LeaderboardEntry[]
  bestProsecutors: LeaderboardEntry[]
}

export default function HallOfShamePage() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${BASE_PATH}/api/leaderboard`)
        if (res.ok) {
          setData(await res.json())
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary touch-manipulation"
      >
        &larr; Back to The Yard
      </Link>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-primary sm:text-4xl">
          HALL OF SHAME
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The most convicted and the most ruthless prosecutors
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="card animate-pulse p-6">
            <div className="h-6 w-48 rounded bg-surface-hover" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold text-danger">Most Wanted</h2>
            <HallOfShameTable
              title="Most Convicted"
              entries={data.mostConvicted}
              countLabel="Convictions"
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-primary">
              Top Prosecutors
            </h2>
            <HallOfShameTable
              title="Best Prosecutors"
              entries={data.bestProsecutors}
              countLabel="Wins"
            />
          </section>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          Failed to load leaderboard.
        </p>
      )}
    </div>
  )
}
