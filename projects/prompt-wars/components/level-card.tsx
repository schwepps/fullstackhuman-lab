'use client'

import Link from 'next/link'
import type { MouseEvent } from 'react'

interface LevelCardProps {
  id: number
  name: string
  description: string
  stageCount: number
  isUnlocked: boolean
  isCompleted: boolean
  score: number
  learningTeaser: string
  onDebrief?: (levelId: number) => void
  onShare?: (levelId: number) => void
}

export function LevelCard({
  id,
  name,
  description,
  stageCount,
  isUnlocked,
  isCompleted,
  score,
  learningTeaser,
  onDebrief,
  onShare,
}: LevelCardProps) {
  if (!isUnlocked) {
    return (
      <div className="terminal-border border-muted/20 bg-popover/50 p-4 opacity-40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">LEVEL {id}</span>
          <span className="text-xs text-muted-foreground">LOCKED</span>
        </div>
        <div className="text-sm text-muted-foreground">{name}</div>
        <div className="text-xs text-muted-foreground/60 mt-1">
          Beat Level {id - 1} to unlock
        </div>
      </div>
    )
  }

  function handleAction(e: MouseEvent, action: (levelId: number) => void) {
    e.preventDefault()
    e.stopPropagation()
    action(id)
  }

  return (
    <Link
      href={`/play/${id}`}
      className={`block terminal-border p-4 transition-all touch-manipulation
        ${isCompleted ? 'border-primary/40 hover:border-primary/60' : 'hover:border-accent/40'}
        hover:shadow-[0_0_20px_rgba(0,255,65,0.1)]
        active:scale-[0.98]`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-accent">LEVEL {id}</span>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-xs text-primary">{score}pts</span>
          )}
          <span
            className={`text-xs ${isCompleted ? 'text-primary' : 'text-warning'}`}
          >
            {isCompleted ? 'BREACHED' : 'ACTIVE'}
          </span>
        </div>
      </div>
      <div
        className={`text-sm ${isCompleted ? 'text-primary' : 'text-foreground'}`}
      >
        {name}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
      {!isCompleted && (
        <div className="text-xs text-accent/60 mt-1 italic">
          {learningTeaser}
        </div>
      )}
      <div className="mt-2 flex gap-1">
        {Array.from({ length: stageCount }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 ${isCompleted ? 'bg-primary/40' : 'bg-muted'}`}
          />
        ))}
      </div>

      {/* Persistent actions for completed levels */}
      {isCompleted && (onDebrief || onShare) && (
        <div className="mt-3 pt-3 border-t border-border/40 flex gap-2">
          {onDebrief && (
            <button
              onClick={(e) => handleAction(e, onDebrief)}
              className="flex-1 h-8 text-xs text-primary border border-primary/40
                         hover:bg-primary/10 hover:border-primary/60 transition-colors
                         touch-manipulation uppercase tracking-wider terminal-text-glow"
            >
              Debrief
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => handleAction(e, onShare)}
              className="flex-1 h-8 text-xs text-muted-foreground border border-muted/30
                         hover:border-primary/40 hover:text-foreground transition-colors
                         touch-manipulation uppercase tracking-wider"
            >
              Share
            </button>
          )}
        </div>
      )}
    </Link>
  )
}
