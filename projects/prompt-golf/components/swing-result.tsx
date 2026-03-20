'use client'

import { useState } from 'react'
import type { ScoreResult, JudgeTestResult } from '@/lib/types'
import {
  getScoreCssClass,
  getScoreDisplayLabel,
  getCelebrationMessage,
} from '@/lib/scoring'

interface SwingResultProps {
  verdict: {
    pass: boolean
    testResults: JudgeTestResult[]
    summary: string
  } | null
  score: ScoreResult | null
  analysis: { summary: string; detail: string } | null
  isPractice: boolean
}

export function SwingResultPanel({
  verdict,
  score,
  analysis,
  isPractice,
}: SwingResultProps) {
  const [isAnalysisExpanded, setAnalysisExpanded] = useState(false)

  if (!verdict && !analysis) return null

  const passed = isPractice || (verdict?.pass ?? false)

  return (
    <div className="space-y-4">
      {/* Verdict */}
      {verdict && !isPractice && (
        <div
          className={`club-card p-4 ${
            verdict.pass ? 'border-primary/40' : 'border-destructive/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-2xl ${verdict.pass ? '' : 'grayscale'}`}>
                {verdict.pass ? '\u26F3' : '\u274C'}
              </span>
              <div>
                <p
                  className={`font-serif text-lg font-bold ${
                    verdict.pass ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {verdict.pass ? 'Passed!' : 'Not quite'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {verdict.summary}
                </p>
              </div>
            </div>

            {/* Score badge */}
            {score && score.isPassing && (
              <div className="animate-score-pop text-right">
                <p
                  className={`font-serif text-2xl font-bold ${getScoreCssClass(score.label)}`}
                >
                  {getScoreDisplayLabel(score.label)}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {score.effectiveStrokes} words (target {score.par})
                </p>
              </div>
            )}
          </div>

          {/* Celebration message */}
          {score && score.isPassing && (
            <p className="mt-3 font-serif text-sm italic text-muted-foreground">
              {getCelebrationMessage(score.label)}
            </p>
          )}
        </div>
      )}

      {/* Analysis (collapsible) */}
      {analysis && (
        <div className="club-card p-4">
          <button
            onClick={() => setAnalysisExpanded(!isAnalysisExpanded)}
            className="flex min-h-11 w-full items-center justify-between rounded-sm text-left touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={isAnalysisExpanded}
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm uppercase tracking-wider text-accent">
                Analysis
              </span>
              {passed && (
                <span className="text-xs text-muted-foreground">
                  {isPractice ? '(practice)' : ''}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {isAnalysisExpanded ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {/* Summary (always visible) */}
          <p className="mt-2 font-mono text-sm text-foreground/90">
            {analysis.summary}
          </p>

          {/* Detail (expandable) */}
          {isAnalysisExpanded && (
            <div className="mt-3 border-t border-border/40 pt-3">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {analysis.detail}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
