'use client'

import { useSession } from '@/hooks/use-session'
import { useRound } from '@/hooks/use-round'
import { MemberPicker } from '@/components/member-picker'
import { Onboarding } from '@/components/onboarding'
import { MemberGrid } from '@/components/member-grid'
import { RoundStatus } from '@/components/round-status'
import { CrimeSubmitForm } from '@/components/crime-submit-form'
import { CrimePool } from '@/components/crime-pool'
import { MEMBERS } from '@/lib/members'

export default function TheYard() {
  const { session, isIdentified, selectMember, completeOnboarding } =
    useSession()

  // Step 1: Identity selection
  if (!isIdentified) {
    return <MemberPicker onSelect={selectMember} />
  }

  // Step 2: Onboarding for first-time players
  if (!session.onboardingComplete) {
    return (
      <>
        <Onboarding currentSkill={null} onComplete={completeOnboarding} />
        <YardContent
          memberId={session.memberId}
          memberName={session.memberName}
        />
      </>
    )
  }

  // Step 3: The Yard
  return (
    <YardContent memberId={session.memberId} memberName={session.memberName} />
  )
}

function YardContent({
  memberId,
  memberName,
}: {
  memberId: string
  memberName: string
}) {
  const {
    round,
    evidence,
    skill,
    isLoading,
    isAdvancing,
    canCallCourt,
    callCourt,
    refresh,
  } = useRound()

  const hasActiveRound = round !== null && round.phase !== 'closed'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-1 text-4xl font-black tracking-tight text-primary sm:text-5xl">
          THE YARD
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back,{' '}
          <span className="font-semibold text-foreground">{memberName}</span>
        </p>
      </div>

      {/* Current round status */}
      <section className="mb-6" aria-label="Current round">
        {isLoading ? (
          <div className="card animate-pulse p-6">
            <div className="h-6 w-24 rounded bg-surface-hover" />
            <div className="mt-4 h-8 w-3/4 rounded bg-surface-hover" />
          </div>
        ) : (
          <RoundStatus
            round={round}
            skill={skill}
            evidenceCount={evidence.length}
            onCallCourt={() => callCourt(memberId)}
            canCallCourt={canCallCourt}
            isAdvancing={isAdvancing}
          />
        )}
      </section>

      {/* Crime pool — only show when no active round */}
      {!hasActiveRound && (
        <section className="mb-6" aria-label="Crime pool">
          <CrimePool
            memberId={memberId}
            hasActiveRound={hasActiveRound}
            onRoundStarted={refresh}
          />
        </section>
      )}

      {/* Crime submission */}
      <section className="mb-8" aria-label="Submit a crime">
        <CrimeSubmitForm memberId={memberId} onSubmitted={refresh} />
      </section>

      {/* Member grid */}
      <section aria-label="Inmates">
        <h2 className="mb-4 text-lg font-bold text-foreground">The Inmates</h2>
        <MemberGrid members={MEMBERS} />
      </section>
    </div>
  )
}
