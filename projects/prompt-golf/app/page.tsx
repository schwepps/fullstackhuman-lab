import Link from 'next/link'
import { getChallengesByCourseName } from '@/lib/challenges'
import { COURSES } from '@/lib/constants'

export default function HomePage() {
  const frontNine = getChallengesByCourseName('front-9')
  const publicCourse = COURSES['public-9']

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-safe sm:px-6 sm:py-12">
      {/* Logo / Title */}
      <div className="text-center">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-accent/50">
          Est. 2026
        </div>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Prompt Golf
        </h1>
        <div className="gold-divider mx-auto mt-4 w-32" />
        <p className="mt-4 font-serif text-lg text-muted-foreground sm:text-xl">
          Describe code in natural language.
          <br />
          <span className="text-accent">Fewest words wins.</span>
        </p>
      </div>

      {/* Front 9 */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            The Front 9
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            Utility Functions
          </span>
        </div>

        <div className="gold-divider mt-2" />

        <div className="mt-4 grid gap-3">
          {frontNine.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/play/${challenge.id}`}
              className="club-card group flex items-center justify-between p-4 transition-all hover:border-accent/40 hover:shadow-[0_0_12px_rgba(201,168,76,0.1)] active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 font-serif text-sm font-bold text-accent sm:h-11 sm:w-11">
                  {challenge.holeNumber}
                </span>
                <div>
                  <p className="font-serif text-sm font-semibold text-foreground group-hover:text-accent">
                    {challenge.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {challenge.principle}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-accent">
                  Par {challenge.par}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Public Course (locked) */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground/50">
            {publicCourse.name}
          </h2>
          <span className="font-mono text-xs text-muted-foreground/50">
            {publicCourse.subtitle}
          </span>
        </div>

        <div className="gold-divider mt-2 opacity-30" />

        <div className="mt-4 club-card border-border/30 p-6 text-center opacity-60">
          <p className="font-serif text-lg text-muted-foreground">
            Coming Soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {publicCourse.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="font-serif text-xs text-muted-foreground/40">
          A{' '}
          <a
            href="https://fullstackhuman.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
          >
            FullStackHuman
          </a>{' '}
          Lab Project
        </p>
      </div>
    </div>
  )
}
