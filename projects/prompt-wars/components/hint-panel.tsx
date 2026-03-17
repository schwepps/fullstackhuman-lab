'use client'

import { useState } from 'react'
import {
  HINT_THRESHOLD_1,
  HINT_THRESHOLD_2,
  HINT_THRESHOLD_3,
} from '@/lib/constants'

interface HintPanelProps {
  hints: [string, string, string]
  attemptCount: number
}

const THRESHOLDS = [HINT_THRESHOLD_1, HINT_THRESHOLD_2, HINT_THRESHOLD_3]

function getNextHintThreshold(attemptCount: number): number | null {
  return THRESHOLDS.find((t) => attemptCount < t) ?? null
}

export function HintPanel({ hints, attemptCount }: HintPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const availableHints: string[] = []
  if (attemptCount >= HINT_THRESHOLD_1) availableHints.push(hints[0])
  if (attemptCount >= HINT_THRESHOLD_2) availableHints.push(hints[1])
  if (attemptCount >= HINT_THRESHOLD_3) availableHints.push(hints[2])

  const nextThreshold = getNextHintThreshold(attemptCount)

  return (
    <div className="terminal-border border-warning/20 bg-popover">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-sm touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <span className="text-warning">[?]</span>
          <span className="text-muted-foreground">
            Hints ({availableHints.length}/3)
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          {expanded ? '[-]' : '[+]'}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {availableHints.length === 0 && (
            <div className="text-xs text-muted-foreground/60">
              First hint unlocks after {HINT_THRESHOLD_1} attempts
            </div>
          )}

          {availableHints.map((hint, i) => (
            <div
              key={i}
              className="text-xs text-warning/80 pl-4 border-l border-warning/20 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-warning/40 mr-1">#{i + 1}</span>
              {hint}
            </div>
          ))}

          {nextThreshold && (
            <div className="text-xs text-muted-foreground/40 pl-4">
              Next hint at {nextThreshold} attempts (
              {nextThreshold - attemptCount} more)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
