'use client'

import Link from 'next/link'
import { useSession } from '@/hooks/use-session'
import { LevelCard } from '@/components/level-card'
import { LevelProgress } from '@/components/level-progress'
import { SubmitScore } from '@/components/submit-score'
import { SupportCta } from '@/components/support-cta'
import type { LevelPublicInfo } from '@/lib/types'

interface HomeContentProps {
  levels: LevelPublicInfo[]
}

export function HomeContent({ levels }: HomeContentProps) {
  const {
    state: session,
    getLevelProgress,
    isLevelUnlocked,
    getCompletedCount,
    getTotalScore,
    setDisplayName,
  } = useSession()

  const completedCount = getCompletedCount()
  const totalScore = getTotalScore()

  return (
    <main className="min-h-svh p-4 sm:p-6 lg:p-8 pb-safe">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl text-primary terminal-text-glow mb-2 animate-glitch-intermittent">
          {'>'} PROMPT_WARS
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Craft prompts to extract secrets from AI systems with increasingly
          hardened defenses. 7 levels. How far can you get?
        </p>

        {/* Overall progress */}
        <div className="terminal-border p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-accent">MISSION_PROGRESS</span>
            <span className="text-xs text-primary">
              {totalScore > 0 ? `${totalScore}pts` : ''}
            </span>
          </div>
          <LevelProgress
            currentLevel={completedCount + 1}
            completedLevels={completedCount}
          />
        </div>
      </div>

      {/* Level grid */}
      <div className="max-w-2xl mx-auto grid gap-3">
        {levels.map((level) => {
          const progress = getLevelProgress(level.id)
          return (
            <LevelCard
              key={level.id}
              id={level.id}
              name={level.name}
              description={level.description}
              stageCount={level.stages.length}
              isUnlocked={isLevelUnlocked(level.id)}
              isCompleted={progress.completed}
              score={progress.score}
            />
          )
        })}
      </div>

      {/* Submit score */}
      <div className="max-w-2xl mx-auto mt-6">
        <SubmitScore
          sessionId={session.sessionId}
          displayName={session.displayName}
          onDisplayNameChange={setDisplayName}
          completedCount={completedCount}
        />
      </div>

      {/* Leaderboard link */}
      <div className="max-w-2xl mx-auto mt-3">
        <Link
          href="/leaderboard"
          className="block terminal-border p-3 text-center text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors touch-manipulation"
        >
          {'>'} VIEW LEADERBOARD
        </Link>
      </div>

      {/* Support */}
      <div className="max-w-2xl mx-auto mt-3">
        <SupportCta variant="card" />
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto mt-8 text-center">
        <p className="text-xs text-muted-foreground/60">
          A <span className="text-accent/60">FullStackHuman</span> lab
          experiment
        </p>
      </div>
    </main>
  )
}
