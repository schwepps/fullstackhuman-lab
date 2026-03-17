'use client'

import { TOTAL_LEVELS } from '@/lib/constants'

interface LevelProgressProps {
  currentLevel: number
  completedLevels: number
}

export function LevelProgress({
  currentLevel,
  completedLevels,
}: LevelProgressProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
          const level = i + 1
          const isCompleted = level <= completedLevels
          const isCurrent = level === currentLevel
          return (
            <div
              key={level}
              className={`h-2 flex-1 transition-colors ${
                isCompleted
                  ? 'bg-primary'
                  : isCurrent
                    ? 'bg-accent'
                    : 'bg-muted'
              }`}
              title={`Level ${level}`}
            />
          )
        })}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {completedLevels}/{TOTAL_LEVELS}
      </span>
    </div>
  )
}
