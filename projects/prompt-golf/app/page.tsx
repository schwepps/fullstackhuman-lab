import Link from 'next/link'
import { getChallengesByCourseName } from '@/lib/challenges'
import { COURSES } from '@/lib/constants'
import { SupportCta } from '@/components/support-cta'

export default function HomePage() {
  const frontNine = getChallengesByCourseName('front-9')
  const publicCourse = COURSES['public-9']

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-safe sm:px-6 sm:py-12">
      {/* Logo / Title */}
      <div className="text-center">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-accent/70">
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

      {/* How It Works */}
      <div className="mt-8 club-card p-5">
        <h2 className="text-center font-serif text-sm uppercase tracking-wider text-accent">
          How It Works
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { step: '1', text: 'Pick a challenge' },
            { step: '2', text: 'Describe the code in few words' },
            { step: '3', text: 'AI writes the code' },
            { step: '4', text: 'Fewer words = better score' },
          ].map(({ step, text }) => (
            <div key={step} className="text-center">
              <span className="flex mx-auto h-8 w-8 items-center justify-center rounded-full border border-accent/30 font-mono text-xs font-bold text-accent">
                {step}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Front 9 */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            The Front 9
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            9 Challenges
          </span>
        </div>

        <div className="gold-divider mt-2" />

        <div className="mt-4 grid gap-3">
          {frontNine.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/play/${challenge.id}`}
              className="club-card group flex items-center justify-between p-4 transition-all hover:border-accent/50 hover:shadow-[0_0_12px_rgba(212,184,122,0.1)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] touch-manipulation"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/30 font-serif text-sm font-bold text-accent">
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
                  Target: {challenge.par}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Public Course (locked) */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground/60">
            {publicCourse.name}
          </h2>
          <span className="font-mono text-xs text-muted-foreground/70">
            {publicCourse.subtitle}
          </span>
        </div>

        <div className="gold-divider mt-2 opacity-40" />

        <div className="club-card mt-4 border-border/40 p-6 text-center opacity-70">
          <p className="font-serif text-lg text-muted-foreground">
            Coming Soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            {publicCourse.description}
          </p>
        </div>
      </div>

      {/* Leaderboard link */}
      <div className="mt-10">
        <Link
          href="/leaderboard"
          className="club-card group flex items-center justify-between p-4 transition-all hover:border-accent/50 hover:shadow-[0_0_12px_rgba(212,184,122,0.1)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
        >
          <div>
            <span className="font-serif text-sm font-semibold text-foreground group-hover:text-accent">
              Leaderboard
            </span>
          </div>
          <span className="text-accent/50 group-hover:text-accent">&rarr;</span>
        </Link>
      </div>

      {/* Support */}
      <div className="mt-4">
        <SupportCta variant="card" />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="font-serif text-xs text-muted-foreground/70">
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
