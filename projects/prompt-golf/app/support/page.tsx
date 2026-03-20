import Link from 'next/link'
import { KOFI_URL, COST_PER_SWING, COST_PER_PRACTICE } from '@/lib/constants'

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 pb-safe sm:px-6 sm:py-12">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center font-serif text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
      >
        &larr; Clubhouse
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">
        Support Prompt Golf
      </h1>

      <div className="gold-divider mt-4" />

      <div className="mt-6 space-y-6 text-sm text-muted-foreground">
        <p className="font-serif text-base text-foreground/80">
          Prompt Golf is free to play, with no ads and no tracking. Every swing
          calls real AI models that cost real money.
        </p>

        {/* Cost breakdown */}
        <div className="club-card overflow-hidden">
          <div className="border-b border-border/50 bg-card/50 px-4 py-2">
            <h2 className="font-serif text-sm uppercase tracking-wider text-accent">
              Cost Per Swing
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="px-4 py-2 text-left font-serif text-xs uppercase tracking-wider text-muted-foreground">
                  Swing Type
                </th>
                <th className="px-4 py-2 text-left font-serif text-xs uppercase tracking-wider text-muted-foreground">
                  Models Used
                </th>
                <th className="px-4 py-2 text-right font-serif text-xs uppercase tracking-wider text-muted-foreground">
                  Est. Cost
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="px-4 py-2.5 text-foreground/80">
                  Practice swing
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  Haiku (gen + analysis)
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-primary">
                  ~${COST_PER_PRACTICE.toFixed(3)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-foreground/80">Scored swing</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  Haiku (gen) + Sonnet (judge) + Haiku (analysis)
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-accent">
                  ~${COST_PER_SWING.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          A typical playthrough (2 practice + 2-3 scored per hole, 9 holes)
          costs about <span className="font-mono text-accent">$0.15-0.20</span>.
        </p>
        <p>
          <span className="font-mono text-primary">$5</span> on Ko-fi covers
          roughly{' '}
          <span className="font-mono text-primary">1,200 scored swings</span> —
          enough for many players to enjoy the full course.
        </p>

        {/* Ko-fi button */}
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-fairway block text-center"
        >
          Support on Ko-fi
        </a>

        <p className="text-center text-xs text-muted-foreground/40">
          100% voluntary. The course stays open regardless.
        </p>
      </div>
    </div>
  )
}
