'use client'

import type { LeaderboardEntry } from '@/lib/types'
import { TOTAL_LEVELS } from '@/lib/constants'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="terminal-border bg-popover overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 border-b border-border text-xs text-accent uppercase tracking-wider">
        <span>#</span>
        <span>Name</span>
        <span className="hidden sm:block">Levels</span>
        <span>Score</span>
        <span className="hidden sm:block">Attempts</span>
      </div>

      {/* Entries */}
      {entries.map((entry) => (
        <div
          key={`${entry.rank}-${entry.displayName}`}
          className={`grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 border-b border-border/30 last:border-0 text-sm
            ${entry.rank <= 3 ? 'bg-primary/5' : ''}`}
        >
          <span
            className={`w-6 ${
              entry.rank === 1
                ? 'text-warning'
                : entry.rank === 2
                  ? 'text-foreground/80'
                  : entry.rank === 3
                    ? 'text-warning/60'
                    : 'text-muted-foreground'
            }`}
          >
            {entry.rank}
          </span>
          <span className="text-foreground truncate">{entry.displayName}</span>
          <span className="hidden sm:block text-accent text-xs">
            {entry.levelsCompleted}/{TOTAL_LEVELS}
          </span>
          <span className="text-primary terminal-text-glow">
            {entry.totalScore}
          </span>
          <span className="hidden sm:block text-muted-foreground text-xs">
            {entry.totalAttempts}
          </span>
        </div>
      ))}
    </div>
  )
}
