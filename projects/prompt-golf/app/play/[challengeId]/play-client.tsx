'use client'

import { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSwing } from '@/hooks/use-swing'
import { useSession } from '@/hooks/use-session'
import { PromptInput } from '@/components/prompt-input'
import { CodeOutput } from '@/components/code-output'
import { SwingResultPanel } from '@/components/swing-result'
import { ShareButtons } from '@/components/share-buttons'
import { SupportCta } from '@/components/support-cta'
import { getScoreDisplayLabel } from '@/lib/scoring'

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
                      {progress.optimalPrompt.split(/\s+/).length} words
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

      {/* Mode indicator — only when actively playing */}
      {showRetryInput && (
        <div className="mb-4 flex items-center gap-3">
          {mode === 'practice' ? (
            <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span className="font-serif text-xs uppercase tracking-wider text-primary">
                Practice Mode
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({2 - progress.practiceSwings} free{' '}
                {2 - progress.practiceSwings === 1 ? 'try' : 'tries'} left)
              </span>
            </div>
          ) : (
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
          )}

          {progress.isComplete && (
            <span className="font-serif text-xs text-primary">
              {'\u2713'} Completed
            </span>
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

        {/* Result panel */}
        <SwingResultPanel
          verdict={state.verdict}
          score={state.score}
          analysis={state.analysis}
          isPractice={mode === 'practice'}
          prompt={lastPrompt}
        />

        {/* Share buttons */}
        {state.status === 'pass' &&
          mode === 'scored' &&
          state.resultId &&
          state.score && (
            <div className="space-y-3">
              <ShareButtons
                challengeName={challenge.name}
                holeName={`Challenge ${challenge.holeNumber}`}
                prompt={lastPrompt}
                wordCount={state.score.wordCount}
                label={state.score.label}
                resultId={state.resultId}
              />
              <SupportCta variant="inline" />
            </div>
          )}

        {/* Display name prompt (first win only) */}
        {shouldShowNamePrompt && state.status === 'pass' && (
          <div className="club-card border-accent/30 p-4">
            <p className="font-serif text-sm text-foreground">
              Nice work! Enter a name for the leaderboard:
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="flex-1 rounded-sm border border-border bg-background/60 px-3 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                autoFocus={false}
              />
              <button
                onClick={() => {
                  const name = nameInput.trim() || 'Anonymous'
                  setDisplayName(name)
                  setShowNamePrompt(false)
                }}
                className="btn-fairway px-4 py-2 text-xs"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard confirmation */}
        {state.status === 'pass' &&
          mode === 'scored' &&
          !shouldShowNamePrompt && (
            <Link
              href="/leaderboard"
              className="club-card flex items-center justify-between border-primary/30 p-4 transition-all hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">{'\u2713'}</span>
                <span className="font-serif text-sm text-foreground">
                  Score submitted to leaderboard
                </span>
              </div>
              <span className="font-serif text-xs text-accent">
                View rankings &rarr;
              </span>
            </Link>
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
