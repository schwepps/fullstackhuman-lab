'use client'

import type {
  Member,
  CriminalRecord as CriminalRecordType,
  ConvictionEntry,
  Confession,
} from '@/lib/types'

interface CriminalRecordProps {
  member: Member
  record: CriminalRecordType
  convictions: ConvictionEntry[]
  confessions: Confession[]
}

export function CriminalRecord({
  member,
  record,
  convictions,
  confessions,
}: CriminalRecordProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div>
      {/* Mugshot header */}
      <div className="card mb-6 p-6 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-surface-hover text-3xl font-black text-primary">
          {initials}
        </div>
        <h1 className="text-2xl font-black">{member.name}</h1>
        {record.currentAlias && (
          <p className="text-sm italic text-primary">
            aka &ldquo;{record.currentAlias}&rdquo;
          </p>
        )}
        <p className="inmate-number mt-1">{member.role}</p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-black text-danger">
              {record.totalConvictions}
            </p>
            <p className="text-xs text-muted-foreground">Convictions</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary">
              {record.totalProsecutions}
            </p>
            <p className="text-xs text-muted-foreground">Prosecutions</p>
          </div>
          <div>
            <p className="text-2xl font-black text-success">
              {record.totalWins}
            </p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
        </div>
      </div>

      {/* Conviction history */}
      {convictions.length > 0 && (
        <section aria-label="Conviction history">
          <h2 className="mb-3 text-lg font-bold">Conviction History</h2>
          <div className="space-y-3">
            {convictions.map((c, i) => (
              <div key={`${c.roundId}-${i}`} className="card p-4">
                <p className="text-sm font-semibold">
                  &ldquo;{c.crimeText}&rdquo;
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Convicted by {c.convictedBy} &middot;{' '}
                  {new Date(c.date).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {c.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confessions */}
      {confessions.length > 0 && (
        <section className="mt-6" aria-label="Confessions">
          <h2 className="mb-3 text-lg font-bold text-accent">
            True Confessions
          </h2>
          <div className="space-y-2">
            {confessions.map((c, i) => (
              <div
                key={`confession-${i}`}
                className="card border-accent/30 p-3"
              >
                <p className="text-sm italic">&ldquo;{c.text}&rdquo;</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(c.submittedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
