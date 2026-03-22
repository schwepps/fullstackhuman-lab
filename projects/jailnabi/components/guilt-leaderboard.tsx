'use client'

import type { GuiltScore } from '@/lib/types'

interface GuildLeaderboardProps {
  scores: GuiltScore[]
}

function getBarColor(index: number, total: number): string {
  if (index === 0) return 'bg-danger'
  if (index === total - 1) return 'bg-success'
  return 'bg-primary'
}

export function GuildLeaderboard({ scores }: GuildLeaderboardProps) {
  const sorted = [...scores].sort((a, b) => b.guiltScore - a.guiltScore)
  const maxScore = sorted[0]?.guiltScore ?? 100

  return (
    <div className="card p-4" role="region" aria-label="Guilt leaderboard">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-danger">
        Guilt-O-Meter
      </h3>
      <div className="space-y-2">
        {sorted.map((score, i) => (
          <div key={score.sessionId} className="flex items-center gap-3">
            <span className="w-20 truncate text-sm font-medium">
              {score.playerName}
            </span>
            <div className="relative flex-1 h-6 rounded-full bg-surface overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(i, sorted.length)}`}
                style={{
                  width: `${Math.max(5, (score.guiltScore / maxScore) * 100)}%`,
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {score.guiltScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
