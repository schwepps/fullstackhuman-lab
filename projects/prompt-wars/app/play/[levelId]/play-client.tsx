'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { useAttempt } from '@/hooks/use-attempt'
import { TerminalPrompt } from '@/components/terminal-prompt'
import { AiResponse } from '@/components/ai-response'
import { DefenseVisualizer } from '@/components/defense-visualizer'
import { VictoryScreen } from '@/components/victory-screen'
import { FailureFeedback } from '@/components/failure-feedback'
import { LevelProgress } from '@/components/level-progress'
import { HintPanel } from '@/components/hint-panel'
import { AttemptHistory } from '@/components/attempt-history'
import { DefenseExplainer } from '@/components/defense-explainer'
import { TOTAL_LEVELS } from '@/lib/constants'
import type { LevelPublicInfo } from '@/lib/types'

interface PlayClientProps {
  level: LevelPublicInfo
}

export function PlayClient({ level }: PlayClientProps) {
  const levelId = level.id
  const router = useRouter()
  const [showExplainer, setShowExplainer] = useState(false)
  const {
    state: session,
    getLevelProgress,
    isLevelUnlocked,
    recordAttempt,
    recordWin,
    getCompletedCount,
  } = useSession()
  const { state: attempt, sendAttempt, reset: resetAttempt } = useAttempt()
  const lastPromptRef = useRef('')

  const progress = getLevelProgress(levelId)
  const unlocked = isLevelUnlocked(levelId)

  // Redirect if level is locked
  useEffect(() => {
    if (!unlocked && typeof window !== 'undefined') {
      router.replace('/')
    }
  }, [unlocked, router])

  // Record attempt when result comes in
  useEffect(() => {
    if (attempt.result) {
      recordAttempt(levelId, {
        prompt: lastPromptRef.current,
        response: attempt.result.response,
        success: attempt.result.success,
        blockedAtStage: attempt.result.blockedAtStage,
        timestamp: Date.now(),
      })

      if (attempt.result.success && attempt.result.score != null) {
        recordWin(levelId, attempt.result.score, lastPromptRef.current)
      }
    }
  }, [attempt.result, levelId, recordAttempt, recordWin])

  const handleSubmit = useCallback(
    (prompt: string) => {
      lastPromptRef.current = prompt
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
    setShowExplainer(true)
  }, [])

  const handleCloseExplainer = useCallback(() => {
    setShowExplainer(false)
    resetAttempt()
  }, [resetAttempt])

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

            {/* Hints */}
            <HintPanel hints={level.hints} attemptCount={progress.attempts} />
          </div>

          {/* Right column: Response + Feedback + History */}
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

            {/* Attempt history */}
            <AttemptHistory
              history={progress.history}
              totalAttempts={progress.attempts}
            />
          </div>
        </div>
      </div>

      {/* Victory overlay */}
      {attempt.status === 'success' && attempt.result && !showExplainer && (
        <VictoryScreen
          result={attempt.result}
          levelId={levelId}
          levelName={level.name}
          totalAttempts={progress.attempts + 1}
          onNextLevel={handleNextLevel}
          onDismiss={handleDismissVictory}
        />
      )}

      {/* Educational explainer (shows after dismissing victory) */}
      {showExplainer && (
        <DefenseExplainer
          education={level.education}
          levelId={levelId}
          onClose={handleCloseExplainer}
        />
      )}
    </main>
  )
}
