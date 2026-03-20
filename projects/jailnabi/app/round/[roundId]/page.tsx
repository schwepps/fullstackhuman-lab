'use client'

import { useRound } from '@/hooks/use-round'
import { useSession } from '@/hooks/use-session'
import { RoundStatus } from '@/components/round-status'
import { EvidenceForm } from '@/components/evidence-form'
import { EvidenceGallery } from '@/components/evidence-gallery'
import { DefenseForm } from '@/components/defense-form'
import { MemberPicker } from '@/components/member-picker'
import Link from 'next/link'

export default function RoundPage() {
  const { session, isIdentified, selectMember } = useSession()
  const {
    round,
    evidence,
    skill,
    verdict,
    isLoading,
    isAdvancing,
    canCallCourt,
    callCourt,
    refresh,
  } = useRound()

  if (!isIdentified) {
    return <MemberPicker onSelect={selectMember} />
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="card animate-pulse p-6">
          <div className="h-6 w-32 rounded bg-surface-hover" />
          <div className="mt-4 h-8 w-3/4 rounded bg-surface-hover" />
        </div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-lg text-muted-foreground">No active round.</p>
        <Link href="/" className="btn btn-primary mt-4 inline-flex">
          Back to The Yard
        </Link>
      </div>
    )
  }

  const isAccused = evidence.some((e) => e.suspectId === session.memberId)
  const hasVerdictPhase = round.phase === 'verdict' || round.phase === 'closed'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary touch-manipulation"
      >
        &larr; Back to The Yard
      </Link>

      {/* Round status */}
      <section className="mb-6" aria-label="Round status">
        <RoundStatus
          round={round}
          skill={skill}
          evidenceCount={evidence.length}
          onCallCourt={() => callCourt(session.memberId)}
          canCallCourt={canCallCourt}
          isAdvancing={isAdvancing}
        />
      </section>

      {/* Evidence form (prosecution phase) */}
      {round.phase === 'prosecution' && (
        <section className="mb-6" aria-label="Submit evidence">
          <EvidenceForm accuserId={session.memberId} onComplete={refresh} />
        </section>
      )}

      {/* Defense form (defense phase, only for accused) */}
      {round.phase === 'defense' && isAccused && (
        <section className="mb-6" aria-label="Defend yourself">
          <DefenseForm defenderId={session.memberId} onComplete={refresh} />
        </section>
      )}

      {/* Evidence gallery */}
      <section aria-label="Evidence">
        <h2 className="mb-4 text-lg font-bold">Evidence Filed</h2>
        <EvidenceGallery evidence={evidence} showPrompts={hasVerdictPhase} />
      </section>

      {/* Verdict placeholder */}
      {verdict && (
        <section className="mt-6" aria-label="Verdict">
          <div className="card border-danger p-6 text-center">
            <div className="guilty-stamp mb-4">GUILTY</div>
            <p className="text-lg font-bold">{verdict.convictName}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {verdict.explanation}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
