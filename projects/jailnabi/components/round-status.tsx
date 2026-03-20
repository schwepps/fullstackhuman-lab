'use client'

import type { Round } from '@/lib/types'
import type { AISkill } from '@/lib/techniques'

interface RoundStatusProps {
  round: Round | null
  skill: AISkill | null
  evidenceCount: number
  onCallCourt?: () => void
  canCallCourt: boolean
  isAdvancing: boolean
}

const PHASE_CONFIG: Record<
  string,
  { label: string; className: string; description: string }
> = {
  prosecution: {
    label: 'Prosecution',
    className: 'phase-prosecution',
    description: 'Submit evidence against the accused!',
  },
  defense: {
    label: 'Defense',
    className: 'phase-defense',
    description: 'The accused may now defend themselves.',
  },
  deliberation: {
    label: 'Deliberation',
    className: 'phase-verdict',
    description: 'The AI judge is reviewing all evidence...',
  },
  verdict: {
    label: 'Verdict',
    className: 'phase-verdict',
    description: 'The verdict has been delivered!',
  },
  closed: {
    label: 'Closed',
    className: 'phase-verdict',
    description: 'This case is closed.',
  },
}

export function RoundStatus({
  round,
  skill,
  evidenceCount,
  onCallCourt,
  canCallCourt,
  isAdvancing,
}: RoundStatusProps) {
  if (!round) {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          The yard is quiet...
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a crime and start a round to begin.
        </p>
      </div>
    )
  }

  const phase = PHASE_CONFIG[round.phase] ?? PHASE_CONFIG.closed

  return (
    <div className="card p-6">
      {/* Phase badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`phase-badge ${phase.className}`}>{phase.label}</span>
        {evidenceCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {evidenceCount} piece{evidenceCount === 1 ? '' : 's'} of evidence
          </span>
        )}
      </div>

      {/* Crime */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Today&apos;s Crime
        </p>
        <p className="mt-1 text-lg font-bold text-foreground">
          &ldquo;{round.crimeText}&rdquo;
        </p>
      </div>

      {/* AI Skill tip */}
      {skill && (
        <div className="mb-4 rounded-md bg-primary-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Skill: {skill.name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{skill.tip}</p>
        </div>
      )}

      {/* Phase description */}
      <p className="mb-4 text-sm text-muted-foreground">{phase.description}</p>

      {/* Call the Court button */}
      {onCallCourt && round.phase === 'prosecution' && (
        <button
          type="button"
          onClick={onCallCourt}
          disabled={!canCallCourt || isAdvancing}
          className="btn btn-danger w-full"
          aria-label="Call the Court to advance to defense phase"
        >
          {isAdvancing ? 'Calling the Court...' : 'Call the Court'}
        </button>
      )}

      {onCallCourt && round.phase === 'defense' && (
        <button
          type="button"
          onClick={onCallCourt}
          disabled={isAdvancing}
          className="btn btn-danger w-full"
          aria-label="Call the Court to advance to verdict"
        >
          {isAdvancing
            ? 'Calling the Court...'
            : 'Call the Court — Deliver Verdict'}
        </button>
      )}
    </div>
  )
}
