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
      <div className="grid grid-cols-[2rem_1fr_3.5rem_2.5rem] sm:grid-cols-[2rem_1fr_3rem_3.5rem_4rem] gap-x-3 px-3 py-2 border-b border-border text-xs text-accent uppercase tracking-wider">
        <span>#</span>
        <span>Name</span>
        <span className="hidden sm:block text-right">Levels</span>
        <span className="text-right">Score</span>
        <span className="hidden sm:block text-right">Attempts</span>
      </div>

      {/* Entries */}
      {entries.map((entry) => (
        <div
          key={`${entry.rank}-${entry.displayName}`}
          className={`grid grid-cols-[2rem_1fr_3.5rem_2.5rem] sm:grid-cols-[2rem_1fr_3rem_3.5rem_4rem] gap-x-3 px-3 py-2 border-b border-border/30 last:border-0 text-sm
            ${entry.rank <= 3 ? 'bg-primary/5' : ''}`}
        >
          <span
            className={`${
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
          <span className="hidden sm:block text-accent text-xs text-right">
            {entry.levelsCompleted}/{TOTAL_LEVELS}
          </span>
          <span className="text-primary terminal-text-glow text-right">
            {entry.totalScore}
          </span>
          <span className="hidden sm:block text-muted-foreground text-xs text-right">
            {entry.totalAttempts}
          </span>
        </div>
      ))}
    </div>
  )
}
