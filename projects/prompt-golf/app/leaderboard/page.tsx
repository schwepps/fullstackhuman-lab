import Link from 'next/link'
import { getLeaderboard } from '@/lib/leaderboard-client'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  let entries: Awaited<ReturnType<typeof getLeaderboard>> = []
  try {
    entries = await getLeaderboard('front-9', 20)
  } catch {
    // Redis unavailable — show empty state
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 pb-safe sm:px-6 sm:py-12">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center font-serif text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
      >
        &larr; Home
      </Link>

      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Leaderboard
        </h1>
        <span className="font-mono text-xs text-muted-foreground">
          Course Rankings
        </span>
      </div>

      <div className="gold-divider mt-3" />

      <p className="mt-3 font-serif text-sm italic text-muted-foreground/80">
        See how your word count compares to other players.
      </p>

      {entries.length === 0 ? (
        <div className="mt-8 club-card p-8 text-center">
          <p className="font-serif text-lg text-muted-foreground">
            No scores yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Complete any challenge to earn your spot on the board.
          </p>
          <Link href="/" className="btn-fairway mt-6 inline-block">
            Start Playing
          </Link>
        </div>
      ) : (
        <div className="mt-6 club-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-card/50">
                <th className="px-4 py-2.5 text-left font-serif text-xs uppercase tracking-wider text-accent">
                  #
                </th>
                <th className="px-4 py-2.5 text-left font-serif text-xs uppercase tracking-wider text-accent">
                  Player
                </th>
                <th className="px-4 py-2.5 text-right font-serif text-xs uppercase tracking-wider text-accent">
                  Score
                </th>
                <th className="hidden px-4 py-2.5 text-right font-serif text-xs uppercase tracking-wider text-accent sm:table-cell">
                  vs Par
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const relDisplay =
                  entry.relativeScore === 0
                    ? 'E'
                    : entry.relativeScore > 0
                      ? `+${entry.relativeScore}`
                      : String(entry.relativeScore)
                const relColor =
                  entry.relativeScore < 0
                    ? 'text-primary'
                    : entry.relativeScore === 0
                      ? 'text-accent'
                      : 'text-destructive'

                return (
                  <tr
                    key={entry.sessionId}
                    className="border-b border-border/20 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-serif text-sm text-foreground">
                        {entry.displayName || 'Anonymous'}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground/40">
                        {entry.holesCompleted}/9
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-foreground">
                      {entry.totalStrokes}
                    </td>
                    <td
                      className={`hidden px-4 py-3 text-right font-mono text-sm font-bold sm:table-cell ${relColor}`}
                    >
                      {relDisplay}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
