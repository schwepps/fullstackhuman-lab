'use client'

import Link from 'next/link'
import { useSession } from '@/hooks/use-session'
import { getScoreDisplayLabel, getScoreCssClass } from '@/lib/scoring'

interface ChallengeEntry {
  id: string
  holeNumber: number
  name: string
  principle: string
  par: number
}

interface CourseMapProps {
  challenges: ChallengeEntry[]
}

export function CourseMap({ challenges }: CourseMapProps) {
  const { getHoleProgress, completedHolesCount } = useSession()

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          The Front 9
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {completedHolesCount}/{challenges.length} completed
        </span>
      </div>

      <div className="gold-divider mt-2" />

      <div className="mt-4 grid gap-3">
        {challenges.map((challenge) => {
          const progress = getHoleProgress(challenge.id)

          return (
            <Link
              key={challenge.id}
              href={`/play/${challenge.id}`}
              className="club-card group flex items-center justify-between p-4 transition-all hover:border-accent/50 hover:shadow-[0_0_12px_rgba(212,184,122,0.1)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] touch-manipulation"
            >
              <div className="flex items-center gap-4">
                {/* Hole number with completion indicator */}
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full border font-serif text-sm font-bold ${
                    progress.isComplete
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-accent/30 text-accent'
                  }`}
                >
                  {progress.isComplete ? '\u2713' : challenge.holeNumber}
                </span>
                <div>
                  <p className="font-serif text-sm font-semibold text-foreground group-hover:text-accent">
                    {challenge.name}
                  </p>
                  {progress.isComplete && progress.bestPrompt ? (
                    <p className="mt-0.5 text-xs text-primary/80">
                      &ldquo;{progress.bestPrompt}&rdquo;
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {challenge.principle}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                {progress.isComplete && progress.bestScore ? (
                  <div>
                    <span
                      className={`font-serif text-sm font-bold ${
                        progress.bestScore.relativeScore > 0
                          ? 'text-accent'
                          : getScoreCssClass(progress.bestScore.label)
                      }`}
                    >
                      {getScoreDisplayLabel(progress.bestScore.label)}
                    </span>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {progress.bestScore.wordCount} words
                    </p>
                  </div>
                ) : (
                  <span className="font-mono text-sm font-bold text-accent">
                    Target: {challenge.par}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
