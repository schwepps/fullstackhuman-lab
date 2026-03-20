'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useSwing } from '@/hooks/use-swing'
import { useSession } from '@/hooks/use-session'
import { PromptInput } from '@/components/prompt-input'
import { CodeOutput } from '@/components/code-output'
import { SwingResultPanel } from '@/components/swing-result'

interface ChallengeInfo {
  id: string
  name: string
  description: string
  par: number
  principle: string
  course: string
  holeNumber: number
  hints: [string, string, string]
}

interface PlayClientProps {
  challenge: ChallengeInfo
}

export function PlayClient({ challenge }: PlayClientProps) {
  const { state, sendSwing, reset } = useSwing()
  const {
    session,
    getHoleProgress,
    recordPracticeSwing,
    recordScoredAttempt,
    getMulligansRemaining,
    consumeMulligan,
  } = useSession()

  const progress = getHoleProgress(challenge.id)
  const mulligansLeft = getMulligansRemaining(challenge.course)

  // Determine current mode
  const canPractice = progress.practiceSwings < 2
  const [mode, setMode] = useState<'practice' | 'scored'>(
    canPractice ? 'practice' : 'scored'
  )

  const [showMulliganOffer, setShowMulliganOffer] = useState(false)

  const isLoading = state.status === 'sending' || state.status === 'streaming'

  const handleSubmit = useCallback(
    async (prompt: string) => {
      const isPractice = mode === 'practice'

      await sendSwing(
        challenge.id,
        prompt,
        session.sessionId,
        isPractice,
        false
      )

      if (isPractice) {
        recordPracticeSwing(challenge.id)
        if (progress.practiceSwings + 1 >= 2) {
          setMode('scored')
        }
      } else if (state.score) {
        recordScoredAttempt(challenge.id, state.score, prompt)
      }
    },
    [
      mode,
      challenge.id,
      session.sessionId,
      sendSwing,
      recordPracticeSwing,
      recordScoredAttempt,
      progress.practiceSwings,
      state.score,
    ]
  )

  // After a failed scored swing, offer mulligan
  const handleMulligan = useCallback(async () => {
    consumeMulligan(challenge.course)
    setShowMulliganOffer(false)
    reset()
  }, [challenge.course, consumeMulligan, reset])

  const handleNextSwing = useCallback(() => {
    // Check if we should offer mulligan
    if (state.status === 'fail' && mode === 'scored' && mulligansLeft > 0) {
      setShowMulliganOffer(true)
    } else {
      setShowMulliganOffer(false)
    }
    reset()
  }, [state.status, mode, mulligansLeft, reset])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-safe sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="font-serif text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
        >
          &larr; Clubhouse
        </Link>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              Hole {challenge.holeNumber}
            </span>
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              {challenge.name}
            </h1>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-bold text-accent">
              Par {challenge.par}
            </span>
          </div>
        </div>

        <div className="gold-divider mt-3" />

        <p className="mt-3 text-sm text-muted-foreground">
          {challenge.description}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5 font-serif text-[10px] uppercase tracking-wider text-accent/60">
            {challenge.principle}
          </span>
        </div>
      </div>

      {/* Mode indicator */}
      <div className="mb-4 flex items-center gap-3">
        {mode === 'practice' ? (
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-serif text-xs uppercase tracking-wider text-primary">
              Driving Range
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              ({2 - progress.practiceSwings} remaining)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-serif text-xs uppercase tracking-wider text-accent">
              Scored Swing
            </span>
            {mulligansLeft > 0 && (
              <span className="font-mono text-xs text-muted-foreground">
                ({mulligansLeft} mulligan{mulligansLeft > 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        {progress.isComplete && (
          <span className="font-serif text-xs text-primary">
            \u2713 Completed
          </span>
        )}
      </div>

      {/* Mulligan offer */}
      {showMulliganOffer && (
        <div className="mb-4 club-card border-accent/30 p-4">
          <p className="font-serif text-sm text-foreground">
            Tough break. Use a mulligan to retry without penalty?
          </p>
          <div className="mt-3 flex gap-3">
            <button onClick={handleMulligan} className="btn-club text-xs">
              Use Mulligan ({mulligansLeft} left)
            </button>
            <button
              onClick={() => {
                setShowMulliganOffer(false)
                reset()
              }}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              No thanks, retry normally
            </button>
          </div>
        </div>
      )}

      {/* Prompt input */}
      {!showMulliganOffer && (
        <PromptInput
          onSubmit={handleSubmit}
          disabled={isLoading}
          isPractice={mode === 'practice'}
          par={challenge.par}
        />
      )}

      {/* Code output */}
      <div className="mt-6 space-y-4">
        <CodeOutput
          tokens={state.codeTokens}
          code={state.code}
          isStreaming={state.status === 'streaming'}
        />

        {/* Result panel */}
        <SwingResultPanel
          verdict={state.verdict}
          score={state.score}
          analysis={state.analysis}
          isPractice={mode === 'practice'}
        />

        {/* Error */}
        {state.status === 'error' && state.error && (
          <div className="club-card border-destructive/30 p-4">
            <p className="font-serif text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {/* Next swing button */}
        {(state.status === 'pass' ||
          state.status === 'fail' ||
          state.status === 'error') &&
          !showMulliganOffer && (
            <button onClick={handleNextSwing} className="btn-fairway w-full">
              {state.status === 'pass'
                ? progress.isComplete
                  ? 'Try for a Better Score'
                  : 'Next Hole \u2192'
                : 'Try Again'}
            </button>
          )}
      </div>
    </div>
  )
}
