'use client'

import { use, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { useAttempt } from '@/hooks/use-attempt'
import { getLevelPublicInfo } from '@/lib/levels'
import { TerminalPrompt } from '@/components/terminal-prompt'
import { AiResponse } from '@/components/ai-response'
import { DefenseVisualizer } from '@/components/defense-visualizer'
import { VictoryScreen } from '@/components/victory-screen'
import { FailureFeedback } from '@/components/failure-feedback'
import { LevelProgress } from '@/components/level-progress'
import { TOTAL_LEVELS } from '@/lib/constants'

export default function PlayPage({
  params,
}: {
  params: Promise<{ levelId: string }>
}) {
  const { levelId: levelIdStr } = use(params)
  const levelId = parseInt(levelIdStr, 10)
  const router = useRouter()
  const {
    state: session,
    getLevelProgress,
    isLevelUnlocked,
    recordAttempt,
    recordWin,
    getCompletedCount,
  } = useSession()
  const { state: attempt, sendAttempt, reset: resetAttempt } = useAttempt()

  const level = getLevelPublicInfo(levelId)
  const progress = getLevelProgress(levelId)
  const unlocked = isLevelUnlocked(levelId)

  // Redirect if level doesn't exist or is locked
  useEffect(() => {
    if (!level || (!unlocked && typeof window !== 'undefined')) {
      router.replace('/')
    }
  }, [level, unlocked, router])

  // Record attempt when result comes in
  useEffect(() => {
    if (attempt.result) {
      recordAttempt(levelId, {
        prompt: '',
        response: attempt.result.response,
        success: attempt.result.success,
        blockedAtStage: attempt.result.blockedAtStage,
        timestamp: Date.now(),
      })

      if (attempt.result.success && attempt.result.score) {
        recordWin(levelId, attempt.result.score, '')
      }
    }
  }, [attempt.result, levelId, recordAttempt, recordWin])

  const handleSubmit = useCallback(
    (prompt: string) => {
      resetAttempt()
      sendAttempt(levelId, prompt, session.sessionId)
    },
    [levelId, session.sessionId, sendAttempt, resetAttempt]
  )

  const handleNextLevel = useCallback(() => {
    resetAttempt()
    if (levelId < TOTAL_LEVELS) {
      router.push(`/play/${levelId + 1}`)
    } else {
      router.push('/')
    }
  }, [levelId, router, resetAttempt])

  const handleDismissVictory = useCallback(() => {
    resetAttempt()
    router.push('/')
  }, [router, resetAttempt])

  if (!level) return null

  const isProcessing =
    attempt.status === 'sending' || attempt.status === 'streaming'
  const completedCount = getCompletedCount()

  return (
    <main className="min-h-svh pb-safe">
      {/* Header */}
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
              LEVEL {levelId} — {level.name.toUpperCase()}
            </span>
          </div>
          <LevelProgress
            currentLevel={levelId}
            completedLevels={completedCount}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column: Prompt + Pipeline */}
          <div className="space-y-4">
            {/* Level description */}
            <div className="text-sm text-muted-foreground">
              <span className="text-accent">{'>'}</span> {level.description}
            </div>

            {/* Prompt input */}
            <TerminalPrompt
              maxLength={level.maxInputLength}
              onSubmit={handleSubmit}
              disabled={isProcessing}
              error={attempt.status === 'error' ? attempt.error : null}
            />

            {/* Defense pipeline visualizer */}
            <DefenseVisualizer
              stages={attempt.stages}
              isActive={isProcessing}
            />
          </div>

          {/* Right column: Response + Feedback */}
          <div className="space-y-4 mt-4 lg:mt-0">
            {/* AI response */}
            <AiResponse
              tokens={attempt.tokens}
              isStreaming={attempt.status === 'streaming'}
              error={
                attempt.status === 'error' && attempt.stages.length === 0
                  ? attempt.error
                  : null
              }
            />

            {/* Failure feedback */}
            {attempt.status === 'failure' && attempt.result && (
              <FailureFeedback
                blockedAtStage={attempt.result.blockedAtStage}
                defenseLog={attempt.result.defenseLog}
                attemptNumber={progress.attempts + 1}
              />
            )}

            {/* Attempt counter */}
            {progress.attempts > 0 && attempt.status === 'idle' && (
              <div className="text-xs text-muted-foreground text-center">
                {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}{' '}
                on this level
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Victory overlay */}
      {attempt.status === 'success' && attempt.result && (
        <VictoryScreen
          result={attempt.result}
          levelId={levelId}
          levelName={level.name}
          totalAttempts={progress.attempts + 1}
          onNextLevel={handleNextLevel}
          onDismiss={handleDismissVictory}
        />
      )}
    </main>
  )
}
