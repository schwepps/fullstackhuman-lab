'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { LeaderboardEntry } from '@/lib/types'
import { LeaderboardTable } from '@/components/leaderboard-table'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    fetch(`${basePath}/api/leaderboard`)
      .then((r) => r.json())
      .then((data: { entries: LeaderboardEntry[] }) => {
        if (!cancelled) {
          setEntries(data.entries)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-svh p-4 sm:p-6 lg:p-8 pb-safe">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl text-primary terminal-text-glow">
            {'>'} LEADERBOARD
          </h1>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation"
          >
            {'<'} BACK
          </Link>
        </div>

        {loading ? (
          <div className="terminal-border bg-popover p-8 text-center">
            <div className="typing-dots mx-auto">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Loading scores...
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="terminal-border bg-popover p-8 text-center">
            <div className="text-muted-foreground text-sm">
              No scores yet. Be the first to breach the defenses!
            </div>
            <Link href="/" className="btn-terminal inline-block mt-4">
              START PLAYING
            </Link>
          </div>
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </div>
    </main>
  )
}
