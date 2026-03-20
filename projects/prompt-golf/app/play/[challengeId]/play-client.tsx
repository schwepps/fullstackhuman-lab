'use client'

import { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSwing } from '@/hooks/use-swing'
import { useSession } from '@/hooks/use-session'
import { PromptInput } from '@/components/prompt-input'
import { CodeOutput } from '@/components/code-output'
import { SwingResultPanel } from '@/components/swing-result'
import { SupportCta } from '@/components/support-cta'
import { getScoreDisplayLabel } from '@/lib/scoring'
import { countWords } from '@/lib/word-counter'

interface ChallengeInfo {
  id: string
  name: string
  description: string
  par: number
  principle: string
  course: string
  holeNumber: number
  totalHoles: number
  nextChallengeId: string | null
  hints: [string, string, string]
}

interface PlayClientProps {
  challenge: ChallengeInfo
}

export function PlayClient({ challenge }: PlayClientProps) {
  const router = useRouter()
  const { state, sendSwing, reset } = useSwing()
  const {
    session,
    setDisplayName,
    getHoleProgress,
    recordPracticeSwing,
    recordScoredAttempt,
    recordAnalysis,
    getMulligansRemaining,
    consumeMulligan,
  } = useSession()

  const progress = getHoleProgress(challenge.id)
  const mulligansLeft = getMulligansRemaining(challenge.course)

  // Mode is derived from session progress — not independent state.
  const canPractice = progress.practiceSwings < 2
  const [modeOverride, setModeOverride] = useState<'scored' | null>(null)
  const mode = modeOverride ?? (canPractice ? 'practice' : 'scored')

  const [showMulliganOffer, setShowMulliganOffer] = useState(false)
  const [pendingMulligan, setPendingMulligan] = useState(false)
  // When returning to a completed challenge, show debrief until player clicks "improve"
  const [userWantsRetry, setUserWantsRetry] = useState(false)
  const showRetryInput = !progress.isComplete || userWantsRetry

  const [lastPrompt, setLastPrompt] = useState('')

  // Display name prompt — shown on first win if no name set
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState(session.displayName)

  const isLoading = state.status === 'sending' || state.status === 'streaming'

  useEffect(() => {
    if (
      state.score &&
      state.score.isPassing &&
      mode === 'scored' &&
      lastPrompt
    ) {
      recordScoredAttempt(challenge.id, state.score, lastPrompt)
    }
  }, [state.score, mode, challenge.id, lastPrompt, recordScoredAttempt])

  // Derive name prompt visibility — show on first pass without a display name
  const shouldShowNamePrompt =
    showNamePrompt || (state.status === 'pass' && !session.displayName)

  // Save analysis (optimalPrompt + concept) to session on pass
  useEffect(() => {
    if (
      state.analysis?.optimalPrompt &&
      state.analysis?.concept &&
      state.status === 'pass'
    ) {
      recordAnalysis(
        challenge.id,
        state.analysis.optimalPrompt,
        state.analysis.concept
      )
    }
  }, [state.analysis, state.status, challenge.id, recordAnalysis])

  const handleSubmit = useCallback(
    async (prompt: string) => {
      const isPractice = mode === 'practice'
      setLastPrompt(prompt)

      const isMulligan = pendingMulligan
      if (isMulligan) setPendingMulligan(false)

      // Has the player already seen the pro prompt for this hole?
      const alreadyRevealedForThisHole = progress.optimalPrompt != null

      await sendSwing(
        challenge.id,
        prompt,
        session.sessionId,
        isPractice,
        isMulligan,
        session.displayName,
        alreadyRevealedForThisHole
      )

      if (isPractice) {
        recordPracticeSwing(challenge.id)
        if (progress.practiceSwings + 1 >= 2) {
          setModeOverride('scored')
        }
      }
    },
    [
      mode,
      pendingMulligan,
      challenge.id,
      session.sessionId,
      session.displayName,
      progress.optimalPrompt,
      sendSwing,
      recordPracticeSwing,
      progress.practiceSwings,
    ]
  )

  const handleMulligan = useCallback(() => {
    consumeMulligan(challenge.course)
    setPendingMulligan(true)
    setShowMulliganOffer(false)
    reset()
  }, [challenge.course, consumeMulligan, reset])

  const handleNextAction = useCallback(() => {
    if (state.status === 'fail' && mode === 'scored' && mulligansLeft > 0) {
      setShowMulliganOffer(true)
      return
    }

    if (state.status === 'pass' && challenge.nextChallengeId) {
      router.push(`/play/${challenge.nextChallengeId}`)
      return
    }

    if (state.status === 'pass' && !challenge.nextChallengeId) {
      router.push('/')
      return
    }

    setShowMulliganOffer(false)
    reset()
  }, [
    state.status,
    mode,
    mulligansLeft,
    challenge.nextChallengeId,
    router,
    reset,
  ])

  const getNextButtonText = () => {
    if (state.status === 'pass') {
      if (challenge.nextChallengeId) {
        return 'Next Challenge \u2192'
      }
      return 'Back to Home \u2192'
    }
    return 'Try Again'
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-safe sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-serif text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
        >
          &larr; Home
        </Link>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="font-mono text-xs text-muted-foreground">
              Challenge {challenge.holeNumber} of {challenge.totalHoles}
            </span>
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              {challenge.name}
            </h1>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-accent">
              Target: {challenge.par} words
            </span>
          </div>
        </div>

        <div className="gold-divider mt-3" />

        <p className="mt-3 text-sm text-muted-foreground">
          {challenge.description}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-serif text-[10px] uppercase tracking-wider text-accent">
            {challenge.principle}
          </span>
        </div>
      </div>

      {/* Debrief — shown when returning to a completed challenge */}
      {progress.isComplete &&
        !showRetryInput &&
        state.status === 'idle' &&
        progress.bestPrompt &&
        progress.bestScore && (
          <div className="space-y-4">
            {/* Your best result */}
            <div className="club-card overflow-hidden border-primary/30">
              <div className="px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-xs uppercase tracking-wider text-primary">
                    Your Best
                  </p>
                  <span
                    className={`font-serif text-sm font-bold ${
                      progress.bestScore.relativeScore > 0
                        ? 'text-accent'
                        : 'score-birdie'
                    }`}
                  >
                    {getScoreDisplayLabel(progress.bestScore.label)}
                  </span>
                </div>
                <p className="mt-2 font-serif text-xl text-foreground">
                  &ldquo;{progress.bestPrompt}&rdquo;
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {progress.bestScore.wordCount} words &middot; target{' '}
                  {progress.bestScore.par}
                </p>
              </div>

              {/* Persisted educational content */}
              {progress.optimalPrompt && progress.concept && (
                <div className="border-t border-border/30 px-5 py-4">
                  <p className="font-serif text-xs uppercase tracking-wider text-accent">
                    Pro Prompt
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="font-serif text-xl text-foreground">
                      &ldquo;{progress.optimalPrompt}&rdquo;
                    </p>
                    <span className="ml-3 shrink-0 font-mono text-sm text-primary">
                      {countWords(progress.optimalPrompt)} words
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">
                      Why it works:{' '}
                    </span>
                    {progress.concept}
                  </p>
                </div>
              )}
            </div>

            {/* Try to improve */}
            <button
              onClick={() => setUserWantsRetry(true)}
              className="btn-fairway w-full"
            >
              Try to Improve Your Score
            </button>

            {/* Navigate to next challenge */}
            {challenge.nextChallengeId && (
              <button
                onClick={() =>
                  router.push(`/play/${challenge.nextChallengeId}`)
                }
                className="btn-club w-full"
              >
                Next Challenge &rarr;
              </button>
            )}
          </div>
        )}

      {/* Mode toggle — switch between practice and scored */}
      {showRetryInput && (
        <div className="mb-4 space-y-3">
          {canPractice && state.status === 'idle' && (
            <div className="flex rounded-sm border border-border overflow-hidden">
              <button
                onClick={() => setModeOverride(null)}
                className={`flex-1 px-4 py-2.5 font-serif text-xs uppercase tracking-wider transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  mode === 'practice'
                    ? 'bg-primary/15 text-primary border-r border-border'
                    : 'text-muted-foreground hover:text-foreground border-r border-border'
                }`}
              >
                Practice ({2 - progress.practiceSwings} free)
              </button>
              <button
                onClick={() => setModeOverride('scored')}
                className={`flex-1 px-4 py-2.5 font-serif text-xs uppercase tracking-wider transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  mode === 'scored'
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Scored{mulligansLeft > 0 ? ` (${mulligansLeft} retries)` : ''}
              </button>
            </div>
          )}

          {/* Show mode badge when toggle not available */}
          {(!canPractice || state.status !== 'idle') && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                <span className="font-serif text-xs uppercase tracking-wider text-accent">
                  Scored Attempt
                </span>
                {mulligansLeft > 0 && (
                  <span className="font-mono text-xs text-muted-foreground">
                    ({mulligansLeft} free{' '}
                    {mulligansLeft === 1 ? 'retry' : 'retries'})
                  </span>
                )}
              </div>
              {progress.isComplete && (
                <span className="font-serif text-xs text-primary">
                  {'\u2713'} Completed
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Free retry offer */}
      {showMulliganOffer && (
        <div className="club-card mb-4 border-accent/40 p-4">
          <p className="font-serif text-sm text-foreground">
            Tough break. Use a free retry? No penalty applied.
          </p>
          <div className="mt-3 flex gap-3">
            <button onClick={handleMulligan} className="btn-club text-xs">
              Use Free Retry ({mulligansLeft} left)
            </button>
            <button
              onClick={() => {
                setShowMulliganOffer(false)
                reset()
              }}
              className="min-h-11 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
            >
              No thanks, retry normally
            </button>
          </div>
        </div>
      )}

      {/* Prompt input — hidden when showing debrief */}
      {showRetryInput && !showMulliganOffer && state.status === 'idle' && (
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

        {/* Result panel (consolidated: score + share + leaderboard in one card) */}
        <SwingResultPanel
          verdict={state.verdict}
          score={state.score}
          analysis={state.analysis}
          isPractice={mode === 'practice'}
          prompt={lastPrompt}
          resultId={state.resultId}
          challengeName={challenge.name}
          challengeNumber={challenge.holeNumber}
          showNamePrompt={shouldShowNamePrompt}
          nameInput={nameInput}
          onNameChange={setNameInput}
          onNameSave={() => {
            const name = nameInput.trim() || 'Anonymous'
            setDisplayName(name)
            setShowNamePrompt(false)
          }}
        />

        {/* Give up and learn — after 3+ failed scored attempts */}
        {state.status === 'fail' &&
          mode === 'scored' &&
          progress.scoredAttempts >= 3 &&
          !progress.isComplete &&
          !progress.optimalPrompt && (
            <div className="club-card border-accent/30 p-4 text-center">
              <p className="font-serif text-sm text-foreground">
                Struggling? See the answer and learn the technique.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your score won&apos;t be submitted to the leaderboard for this
                challenge.
              </p>
              <button
                onClick={() => {
                  // Trigger a pass-equivalent analysis to get the pro prompt
                  // by marking the hole as seen (blocks future leaderboard)
                  recordAnalysis(challenge.id, 'PENDING', 'PENDING')
                  // Re-run the swing as practice to get the analysis
                  sendSwing(
                    challenge.id,
                    'reveal optimal prompt',
                    session.sessionId,
                    true,
                    false,
                    session.displayName,
                    true
                  )
                }}
                className="btn-club mt-3 text-xs"
              >
                Show me the Pro Prompt
              </button>
            </div>
          )}

        {/* Support CTA — compact */}
        {state.status === 'pass' && mode === 'scored' && (
          <SupportCta variant="inline" />
        )}

        {/* Error */}
        {state.status === 'error' && state.error && (
          <div className="club-card border-destructive/40 p-4">
            <p className="font-serif text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {/* Next action button */}
        {(state.status === 'pass' ||
          state.status === 'fail' ||
          state.status === 'error') &&
          !showMulliganOffer && (
            <button onClick={handleNextAction} className="btn-fairway w-full">
              {getNextButtonText()}
            </button>
          )}
      </div>
    </div>
  )
}
