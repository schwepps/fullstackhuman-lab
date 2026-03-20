import Link from 'next/link'
import { AI_SKILLS } from '@/lib/techniques'
import { MAX_PROMPT_WORDS, EVIDENCE_TYPE_LABELS } from '@/lib/constants'
import type { EvidenceType } from '@/lib/types'

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary touch-manipulation"
      >
        &larr; Back to The Yard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary sm:text-4xl">
          HOW TO PLAY
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jailnabi — the daily accusation game
        </p>
      </div>

      {/* Game loop */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Daily Round</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              1
            </span>
            <p>
              <strong>Crime announced</strong> — An absurd corporate crime is
              selected from the pool.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              2
            </span>
            <p>
              <strong>Prosecution</strong> — Write a prompt (max{' '}
              {MAX_PROMPT_WORDS} words) to make AI generate fake evidence
              against a colleague. Choose evidence type:{' '}
              {Object.values(EVIDENCE_TYPE_LABELS).join(', ')}.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              3
            </span>
            <p>
              <strong>Defense</strong> — Accused members write a prompt to
              generate an alibi. 4-hour deadline — AI auto-generates a weak
              alibi if you don&apos;t show up.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              4
            </span>
            <p>
              <strong>Verdict</strong> — The AI judge scores all evidence,
              announces the winner, and explains WHY the winning prompt worked.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              5
            </span>
            <p>
              <strong>Confessional</strong> — The convicted can share a TRUE fun
              fact to reduce their sentence.
            </p>
          </li>
        </ol>
      </section>

      {/* Scoring */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Scoring</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground"
                >
                  Criterion
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-center text-xs font-semibold uppercase text-muted-foreground"
                >
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2">Prompt efficiency</td>
                <td className="px-4 py-2 text-center">1-3</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2">Evidence quality</td>
                <td className="px-4 py-2 text-center">1-3</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2">AI Skill bonus</td>
                <td className="px-4 py-2 text-center">0-2</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2">Humor</td>
                <td className="px-4 py-2 text-center">1-2</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold">Total</td>
                <td className="px-4 py-2 text-center font-semibold">3-10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Skills */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">AI Skills</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Each round features an AI skill. Use it in your prompt for bonus
          points!
        </p>
        <div className="space-y-2">
          {AI_SKILLS.map((skill) => (
            <div key={skill.id} className="card p-3">
              <p className="font-semibold text-primary">{skill.name}</p>
              <p className="text-sm text-muted-foreground">{skill.tip}</p>
              <p className="mt-1 text-xs italic text-muted-foreground">
                Example: {skill.example}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence types */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Evidence Types</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            Object.entries(EVIDENCE_TYPE_LABELS) as [EvidenceType, string][]
          ).map(([type, label]) => (
            <div key={type} className={`evidence-${type} text-sm`}>
              {label}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
