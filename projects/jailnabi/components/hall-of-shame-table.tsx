'use client'

import type { LeaderboardEntry } from '@/lib/types'

interface HallOfShameTableProps {
  title: string
  entries: LeaderboardEntry[]
  countLabel: string
}

export function HallOfShameTable({
  title,
  entries,
  countLabel,
}: HallOfShameTableProps) {
  if (entries.length === 0) {
    return (
      <div className="card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No records yet. The game hasn&apos;t started!
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full" aria-label={title}>
        <thead>
          <tr className="border-b border-border bg-surface">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Rank
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Inmate
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {countLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr
              key={entry.memberId}
              className="border-b border-border/50 last:border-0"
            >
              <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                #{i + 1}
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">
                  {entry.memberName}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-background">
                  {entry.count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
