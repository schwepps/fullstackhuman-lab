'use client'

import { useState } from 'react'
import type { ScoreResult, JudgeTestResult } from '@/lib/types'
import {
  getScoreCssClass,
  getScoreDisplayLabel,
  getCelebrationMessage,
} from '@/lib/scoring'
import { countWords } from '@/lib/word-counter'

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
}

export function SwingResultPanel({
  verdict,
  score,
  analysis,
  isPractice,
  prompt,
}: SwingResultProps) {
  const [isAnalysisExpanded, setAnalysisExpanded] = useState(false)

  if (!verdict && !analysis) return null

  const passed = isPractice || (verdict?.pass ?? false)

  return (
    <div className="space-y-4">
      {/* ── Victory card ── */}
      {verdict && !isPractice && verdict.pass && score?.isPassing && (
        <div className="club-card overflow-hidden border-primary/40">
          {/* Score hero */}
          <div className="animate-score-pop px-6 py-5 text-center">
            <p
              className={`font-serif text-4xl font-bold ${getScoreCssClass(score.label)}`}
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
            </div>
          )}

          {/* Stats row */}
          <div className="flex border-t border-border/30">
            <div className="flex-1 border-r border-border/30 px-4 py-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">
                {score.wordCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Words
              </p>
            </div>
            {score.attemptNumber > 1 && (
              <div className="flex-1 border-r border-border/30 px-4 py-3 text-center">
                <p className="font-mono text-lg font-bold text-muted-foreground">
                  &times;{score.attemptPenalty}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Attempt {score.attemptNumber}
                </p>
              </div>
            )}
            <div className="flex-1 border-r border-border/30 px-4 py-3 text-center">
              <p className="font-mono text-lg font-bold text-accent">
                {score.par}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Target
              </p>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <p
                className={`font-mono text-lg font-bold ${
                  score.relativeScore < 0
                    ? 'text-primary'
                    : score.relativeScore === 0
                      ? 'text-accent'
                      : 'text-destructive'
                }`}
              >
                {score.relativeScore === 0
                  ? '0'
                  : score.relativeScore > 0
                    ? `+${score.relativeScore}`
                    : score.relativeScore}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {score.attemptNumber > 1 ? 'Effective' : 'vs Target'}
              </p>
            </div>
          </div>

          {/* Penalty explanation */}
          {score.attemptNumber > 1 && (
            <div className="border-t border-border/30 px-4 py-2 text-center">
              <p className="font-mono text-[10px] text-muted-foreground">
                {score.wordCount} words &times; {score.attemptPenalty}x penalty
                = {score.effectiveStrokes} effective (target {score.par})
              </p>
            </div>
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

      {/* ── Analysis card ── */}
      {analysis && (
        <div className="club-card p-4">
          <button
            onClick={() => setAnalysisExpanded(!isAnalysisExpanded)}
            className="flex min-h-11 w-full items-center justify-between rounded-sm text-left touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={isAnalysisExpanded}
          >
            <span className="font-serif text-sm uppercase tracking-wider text-accent">
              {passed ? 'What you can learn' : 'What went wrong'}
            </span>
            <span className="text-xs text-muted-foreground">
              {isAnalysisExpanded ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {/* Summary — parsed into visual chips */}
          <AnalysisSummary text={analysis.summary} passed={passed} />

          {/* Detail (expandable) */}
          {isAnalysisExpanded && (
            <div className="mt-3 border-t border-border/40 pt-3 text-sm leading-relaxed text-muted-foreground">
              {analysis.detail.split('\n\n').map((paragraph, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Optimal prompt + concept (pass only) ── */}
      {analysis?.optimalPrompt && analysis?.concept && (
        <div className="club-card border-accent/30 p-5">
          <p className="font-serif text-xs uppercase tracking-wider text-accent">
            Pro Prompt
          </p>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-serif text-xl text-foreground">
              &ldquo;{analysis.optimalPrompt}&rdquo;
            </p>
            <span className="ml-3 shrink-0 font-mono text-sm text-primary">
              {countWords(analysis.optimalPrompt)} words
            </span>
          </div>

          <div className="gold-divider mt-3" />

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-accent">Why it works: </span>
            {analysis.concept}
          </p>
        </div>
      )}
    </div>
  )
}

/** Parse analysis summary into visual chips instead of a wall of text */
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
