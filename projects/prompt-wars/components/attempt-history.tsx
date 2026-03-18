'use client'

import { useState } from 'react'
import type { AttemptRecord } from '@/lib/types'

interface AttemptHistoryProps {
  history: AttemptRecord[]
  totalAttempts: number
}

export function AttemptHistory({
  history,
  totalAttempts,
}: AttemptHistoryProps) {
  const [expanded, setExpanded] = useState(false)

  if (history.length === 0) return null

  return (
    <div className="terminal-border border-muted/30 bg-popover">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-sm touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">ATTEMPT_LOG</span>
          <span className="text-xs text-muted-foreground/60">
            ({totalAttempts} total)
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          {expanded ? '[-]' : '[+]'}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1 max-h-48 overflow-y-auto terminal-scrollbar">
          {history.map((attempt, i) => (
            <div
              key={attempt.timestamp}
              className="flex items-start justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground/60">
                  #{totalAttempts - i}
                </span>{' '}
                <span className="text-foreground/60 truncate inline-block max-w-50 align-bottom">
                  {attempt.prompt || '(prompt)'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {attempt.blockedAtStage && (
                  <span className="text-muted-foreground/40 hidden sm:inline">
                    {attempt.blockedAtStage}
                  </span>
                )}
                <span
                  className={
                    attempt.success ? 'text-primary' : 'text-destructive'
                  }
                >
                  {attempt.success ? 'BREACHED' : 'DENIED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
