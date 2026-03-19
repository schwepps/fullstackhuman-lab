'use client'

import { useRouter } from 'next/navigation'
import { LevelProgress } from '@/components/level-progress'

interface PlayHeaderProps {
  levelId: number
  levelName: string
  completedLevels: number
}

export function PlayHeader({
  levelId,
  levelName,
  completedLevels,
}: PlayHeaderProps) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-50 bg-background/95 border-b border-border p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation"
          >
            {'<'} BACK
          </button>
          <span className="text-xs text-accent">
            LEVEL {levelId} — {levelName.toUpperCase()}
          </span>
        </div>
        <LevelProgress
          currentLevel={levelId}
          completedLevels={completedLevels}
        />
      </div>
    </div>
  )
}
