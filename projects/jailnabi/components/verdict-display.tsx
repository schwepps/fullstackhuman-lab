'use client'

import type { Verdict } from '@/lib/types'
import { EVIDENCE_TYPE_LABELS } from '@/lib/constants'

interface VerdictDisplayProps {
  verdict: Verdict
}

export function VerdictDisplay({ verdict }: VerdictDisplayProps) {
  return (
    <div className="card border-danger p-6" role="region" aria-label="Verdict">
      {/* Guilty stamp */}
      <div className="mb-6 text-center">
        <div className="guilty-stamp inline-block">GUILTY</div>
      </div>

      {/* Convict */}
      <div className="mb-4 text-center">
        <p className="text-2xl font-black text-foreground">
          {verdict.convictName}
        </p>
        <p className="inmate-number mt-1">
          Convicted by {verdict.winningAccuserName}
        </p>
      </div>

      {/* Crime */}
      <div className="mb-4 rounded-md bg-surface p-3 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Crime
        </p>
        <p className="mt-1 font-semibold">&ldquo;{verdict.crimeText}&rdquo;</p>
      </div>

      {/* Explanation */}
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {verdict.explanation}
      </p>

      {/* Scores */}
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          Evidence Scores
        </h3>
        <div className="space-y-2">
          {verdict.scores.map((score, i) => (
            <div
              key={`${score.accuserId}-${i}`}
              className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{score.accuserName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {EVIDENCE_TYPE_LABELS[score.evidenceType]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {score.reasoning}
                </span>
                <span className="min-w-[2rem] rounded-full bg-primary px-2 py-0.5 text-center text-xs font-bold text-background">
                  {score.total}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
