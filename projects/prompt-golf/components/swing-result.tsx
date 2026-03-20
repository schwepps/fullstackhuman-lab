'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ScoreResult, JudgeTestResult } from '@/lib/types'
import {
  getScoreCssClass,
  getScoreDisplayLabel,
  getCelebrationMessage,
} from '@/lib/scoring'
import { countWords } from '@/lib/word-counter'
import { ShareButtons } from '@/components/share-buttons'

interface SwingResultProps {
  verdict: {
    pass: boolean
    testResults: JudgeTestResult[]
    summary: string
  } | null
  score: ScoreResult | null
  analysis: {
    summary: string
    detail: string
    optimalPrompt: string | null
    concept: string | null
  } | null
  isPractice: boolean
  prompt?: string
  resultId?: string | null
  challengeName?: string
  challengeNumber?: number
  showNamePrompt?: boolean
  nameInput?: string
  onNameChange?: (name: string) => void
  onNameSave?: () => void
}

export function SwingResultPanel({
  verdict,
  score,
  analysis,
  isPractice,
  prompt,
  resultId,
  challengeName,
  challengeNumber,
  showNamePrompt,
  nameInput,
  onNameChange,
  onNameSave,
}: SwingResultProps) {
  const [showLearnMore, setShowLearnMore] = useState(false)

  if (!verdict && !analysis) return null

  const passed = isPractice || (verdict?.pass ?? false)

  return (
    <div className="space-y-4">
      {/* ── Victory card (consolidated: score + share + leaderboard) ── */}
      {verdict && !isPractice && verdict.pass && score?.isPassing && (
        <div className="club-card overflow-hidden border-primary/40">
          {/* Score hero */}
          <div className="animate-score-pop px-6 py-5 text-center">
            <p
              className={`font-serif text-4xl font-bold ${
                score.relativeScore > 0
                  ? 'text-accent'
                  : getScoreCssClass(score.label)
              }`}
            >
              {getScoreDisplayLabel(score.label)}
            </p>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">
              {getCelebrationMessage(score.label)}
            </p>
          </div>

          {/* Player's prompt */}
          {prompt && (
            <div className="border-t border-border/30 px-6 py-3 text-center">
              <p className="font-serif text-lg text-foreground">
                &ldquo;{prompt}&rdquo;
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {score.wordCount} words &middot; target {score.par}
                {score.attemptNumber > 1 &&
                  ` \u00b7 attempt ${score.attemptNumber} (\u00d7${score.attemptPenalty})`}
              </p>
            </div>
          )}

          {/* Share buttons — right inside the victory card */}
          {resultId && (
            <div className="border-t border-border/30 px-4 py-3">
              <ShareButtons
                challengeName={challengeName ?? ''}
                holeName={`Challenge ${challengeNumber ?? ''}`}
                prompt={prompt ?? ''}
                wordCount={score.wordCount}
                label={score.label}
                resultId={resultId}
              />
            </div>
          )}

          {/* Display name prompt (first win) */}
          {showNamePrompt && onNameChange && onNameSave && (
            <div className="border-t border-border/30 px-4 py-3">
              <p className="font-serif text-xs text-foreground">
                Enter a name for the leaderboard:
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Your name"
                  maxLength={30}
                  className="flex-1 rounded-sm border border-border bg-background/60 px-3 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  onClick={onNameSave}
                  className="btn-fairway px-4 py-2 text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard link — compact, inside the card */}
          {!showNamePrompt && (
            <Link
              href="/leaderboard"
              className="flex items-center justify-between border-t border-border/30 px-4 py-2.5 text-xs transition-colors hover:bg-card/50 touch-manipulation"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-primary">{'\u2713'}</span>
                Score submitted
              </span>
              <span className="text-accent">View rankings &rarr;</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Failure card ── */}
      {verdict && !isPractice && !verdict.pass && (
        <div className="club-card border-destructive/40 p-5 text-center">
          <p className="font-serif text-xl font-bold text-destructive">
            Not quite
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {verdict.summary}
          </p>
        </div>
      )}

      {/* ── Learn more (collapsible: analysis + pro prompt) ── */}
      {analysis && (
        <div className="club-card p-4">
          <button
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="flex min-h-11 w-full items-center justify-between rounded-sm text-left touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={showLearnMore}
          >
            <span className="font-serif text-sm uppercase tracking-wider text-accent">
              {passed ? 'What you can learn' : 'What went wrong'}
            </span>
            <span className="text-xs text-muted-foreground">
              {showLearnMore ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {/* Summary chips — always visible */}
          <AnalysisSummary text={analysis.summary} passed={passed} />

          {/* Expanded: detail + pro prompt */}
          {showLearnMore && (
            <div className="mt-3 space-y-4 border-t border-border/40 pt-3">
              {/* Detail paragraphs */}
              <div className="text-sm leading-relaxed text-muted-foreground">
                {analysis.detail.split('\n\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Pro prompt (inside learn more, not a separate card) */}
              {analysis.optimalPrompt && analysis.concept && (
                <div className="rounded-sm border border-accent/20 bg-accent/5 p-4">
                  <p className="font-serif text-xs uppercase tracking-wider text-accent">
                    Pro Prompt
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="font-serif text-lg text-foreground">
                      &ldquo;{analysis.optimalPrompt}&rdquo;
                    </p>
                    <span className="ml-3 shrink-0 font-mono text-sm text-primary">
                      {countWords(analysis.optimalPrompt)} words
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">
                      Why it works:{' '}
                    </span>
                    {analysis.concept}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Parse analysis summary into visual chips */
function AnalysisSummary({ text, passed }: { text: string; passed: boolean }) {
  if (!text) return null

  const loadBearingMatch = text.match(/load[- ]bearing:\s*([^.]+)/i)
  const fillerMatch = text.match(/filler:\s*([^.]+)/i)
  const tipMatch = text.match(/(?:pro tip|tip|try):\s*(.+?)(?:\.|$)/i)
  const misreadMatch = text.match(/misread:\s*([^.]+)/i)

  const hasStructure =
    loadBearingMatch ?? fillerMatch ?? tipMatch ?? misreadMatch

  if (!hasStructure) {
    return <p className="mt-3 text-sm text-foreground/90">{text}</p>
  }

  return (
    <div className="mt-3 space-y-2">
      {loadBearingMatch && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
          <p className="text-sm text-foreground/90">
            <span className="font-semibold text-primary">Key words: </span>
            {loadBearingMatch[1].trim()}
          </p>
        </div>
      )}
      {fillerMatch && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-destructive/60" />
          <p className="text-sm text-foreground/90">
            <span className="font-semibold text-destructive">Removable: </span>
            {fillerMatch[1].trim()}
          </p>
        </div>
      )}
      {tipMatch && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
          <p className="text-sm text-foreground/90">
            <span className="font-semibold text-accent">Tip: </span>
            {tipMatch[1].trim()}
          </p>
        </div>
      )}
      {misreadMatch && !passed && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-destructive" />
          <p className="text-sm text-foreground/90">
            <span className="font-semibold text-destructive">Misread: </span>
            {misreadMatch[1].trim()}
          </p>
        </div>
      )}
    </div>
  )
}
