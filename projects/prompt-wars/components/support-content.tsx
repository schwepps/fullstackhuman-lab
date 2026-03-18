'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { KOFI_URL, COST_PER_ATTEMPT } from '@/lib/constants'

interface Stats {
  totalAttempts: number
  estimatedCostUsd: number
}

const COST_ROWS = [
  { levels: '1–5', model: 'Haiku', calls: 1, cost: COST_PER_ATTEMPT[1] },
  { levels: '6', model: 'Sonnet', calls: 4, cost: COST_PER_ATTEMPT[6] },
  { levels: '7', model: 'Sonnet', calls: 4, cost: COST_PER_ATTEMPT[7] },
]

function isValidStats(data: unknown): data is Stats {
  return (
    typeof data === 'object' &&
    data !== null &&
    'totalAttempts' in data &&
    typeof (data as Stats).totalAttempts === 'number' &&
    'estimatedCostUsd' in data &&
    typeof (data as Stats).estimatedCostUsd === 'number'
  )
}

export function SupportContent() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let cancelled = false
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    fetch(`${basePath}/api/stats`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        if (!cancelled && isValidStats(data)) setStats(data)
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch stats:', err)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-svh p-4 sm:p-6 lg:p-8 pb-safe">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl text-primary terminal-text-glow mb-2">
          {'>'} SUPPORT_PROMPT_WARS
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Prompt Wars is free, has no ads, and does no tracking. Every attempt
          costs real money in Claude API calls. If you enjoyed the challenge,
          consider helping cover the costs.
        </p>

        {/* Why Support */}
        <section className="terminal-border p-4 sm:p-5 mb-4">
          <h2 className="text-xs text-accent uppercase tracking-widest mb-3">
            WHY_SUPPORT
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="text-primary">{'>'}</span> No ads, no tracking,
              no accounts required
            </p>
            <p>
              <span className="text-primary">{'>'}</span> Each attempt runs 1–4
              Claude API calls server-side
            </p>
            <p>
              <span className="text-primary">{'>'}</span> Your support is
              voluntary — the game is always free to play
            </p>
          </div>
          <div className="mt-4">
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-terminal inline-flex items-center justify-center px-6 h-11 text-sm"
            >
              SUPPORT ON KO-FI
            </a>
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="terminal-border p-4 sm:p-5 mb-4">
          <h2 className="text-xs text-accent uppercase tracking-widest mb-3">
            COST_BREAKDOWN
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground/60 text-xs uppercase">
                  <th className="text-left py-1 pr-4">Level</th>
                  <th className="text-left py-1 pr-4">Model</th>
                  <th className="text-right py-1 pr-4">AI Calls</th>
                  <th className="text-right py-1">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {COST_ROWS.map((row) => (
                  <tr key={row.levels} className="border-t border-border/30">
                    <td className="py-1.5 pr-4 text-foreground">
                      {row.levels}
                    </td>
                    <td className="py-1.5 pr-4">{row.model}</td>
                    <td className="py-1.5 pr-4 text-right">{row.calls}</td>
                    <td className="py-1.5 text-right text-primary">
                      ~${row.cost?.toFixed(3) ?? '?'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-3">
            {'>'} Your $5 covers ~1,600 attempts across levels 1–5
          </p>
        </section>

        {/* Community Stats */}
        {stats != null && stats.totalAttempts > 0 && (
          <section className="terminal-border p-4 sm:p-5 mb-4">
            <h2 className="text-xs text-accent uppercase tracking-widest mb-3">
              COMMUNITY_STATS
            </h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-lg sm:text-xl text-primary terminal-text-glow">
                  {stats.totalAttempts.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1">
                  Total Attempts
                </div>
              </div>
              <div>
                <div className="text-lg sm:text-xl text-warning">
                  ~${stats.estimatedCostUsd.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1">
                  Est. AI Cost
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Back link */}
        <Link
          href="/"
          className="block terminal-border p-3 text-center text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors touch-manipulation"
        >
          {'<'} BACK TO LEVELS
        </Link>
      </div>
    </main>
  )
}
