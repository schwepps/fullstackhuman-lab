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
import { PlayHeader } from '@/components/play-header'
import { HintPanel } from '@/components/hint-panel'
import { AttemptHistory } from '@/components/attempt-history'
import { DefenseExplainer } from '@/components/defense-explainer'
import { ShareModal } from '@/components/share-modal'
import { CompletedLevelBar } from '@/components/completed-level-bar'
import { TOTAL_LEVELS } from '@/lib/constants'
import type { LevelPublicInfo } from '@/lib/types'

interface PlayClientProps {
  level: LevelPublicInfo
}

export function PlayClient({ level }: PlayClientProps) {
  const levelId = level.id
  const router = useRouter()
  const [showDebrief, setShowDebrief] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
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
        recordWin(
          levelId,
          attempt.result.score,
          lastPromptRef.current,
          attempt.result.resultId
        )
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

  const handleOpenDebrief = useCallback(() => {
    setShowDebrief(true)
  }, [])

  const handleCloseDebrief = useCallback(() => {
    setShowDebrief(false)
  }, [])

  const handleBackToLevels = useCallback(() => {
    router.push('/')
  }, [router])

  const handleOpenShare = useCallback(() => {
    setShowShareModal(true)
  }, [])

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false)
  }, [])

  const isProcessing =
    attempt.status === 'sending' || attempt.status === 'streaming'
  const completedCount = getCompletedCount()

  return (
    <main className="min-h-svh pb-safe">
      <PlayHeader
        levelId={levelId}
        levelName={level.name}
        completedLevels={completedCount}
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column: Prompt + Pipeline */}
          <div className="space-y-4">
            {/* Level description */}
            <div className="text-sm text-muted-foreground">
              <span className="text-accent">{'>'}</span> {level.description}
            </div>

            {/* Persistent actions for completed levels */}
            {progress.completed && (
              <CompletedLevelBar
                score={progress.score}
                attempts={progress.attempts}
                onOpenDebrief={handleOpenDebrief}
                onOpenShare={handleOpenShare}
              />
            )}

            {/* Prompt input */}
            <TerminalPrompt
              maxLength={level.maxInputLength}
              onSubmit={handleSubmit}
              disabled={isProcessing}
              error={attempt.status === 'error' ? attempt.error : null}
              placeholder={level.placeholder}
            />

            {/* Defense pipeline visualizer */}
            <DefenseVisualizer
              stages={attempt.stages}
              isActive={isProcessing}
            />

            {/* Hints */}
            <HintPanel
              hints={level.hints}
              attemptCount={progress.attempts}
              levelId={level.id}
            />
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
      {attempt.status === 'success' && attempt.result && (
        <VictoryScreen
          result={attempt.result}
          levelId={levelId}
          levelName={level.name}
          difficulty={level.difficulty}
          totalAttempts={progress.attempts}
          onNextLevel={handleNextLevel}
          onViewDebrief={handleOpenDebrief}
          onBackToLevels={handleBackToLevels}
        />
      )}

      {/* Debrief modal */}
      {showDebrief && (
        <DefenseExplainer
          education={level.education}
          levelId={levelId}
          onClose={handleCloseDebrief}
        />
      )}

      {/* Share modal */}
      {showShareModal && (
        <ShareModal
          levelId={levelId}
          levelName={level.name}
          difficulty={level.difficulty}
          score={progress.score}
          attemptsUsed={progress.attempts}
          resultId={progress.resultId}
          onClose={handleCloseShare}
        />
      )}
    </main>
  )
}
