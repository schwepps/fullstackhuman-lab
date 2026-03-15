'use client'

import type { TimelineEntry } from '@/lib/types'

type TimelineProps = {
  entries: TimelineEntry[]
}

export function Timeline({ entries }: TimelineProps) {
  return (
    <div className="card p-6">
      <h3 className="mb-5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        Survival Log
      </h3>

      <div className="relative flex flex-col gap-0">
        {/* Vertical line */}
        <div className="absolute left-4 top-3 bottom-3 w-px bg-border" />

        {entries.map((entry, i) => {
          const sanity = getSanityNumber(entry.sanityLevel)
          const sanityColor = getSanityColor(sanity)

          return (
            <div
              key={`${entry.time}-${i}`}
              className="animate-slide-in relative flex gap-4 pb-6 last:pb-0"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Emoji dot (or fallback circle) */}
              <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-lg">
                {entry.emoji ? (
                  <span className="animate-pop">{entry.emoji}</span>
                ) : (
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${sanityColor.dot}`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Header: time + sanity */}
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-corporate">
                    {entry.time}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-surface-dim sm:block">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${sanityColor.bar}`}
                        style={{
                          width: `${Math.max(0, Math.min(100, sanity))}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${sanityColor.text}`}
                    >
                      {entry.sanityLevel}
                    </span>
                  </div>
                </div>

                {/* Main event — compact */}
                <p className="text-sm leading-relaxed">{entry.event}</p>

                {/* AI thought — italic aside */}
                {entry.thought && (
                  <p className="mt-1.5 text-xs italic text-muted">
                    ({entry.thought})
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getSanityNumber(sanityLevel: string): number {
  const match = sanityLevel.match(/-?\d+/)
  return match ? parseInt(match[0], 10) : 50
}

function getSanityColor(sanity: number) {
  if (sanity > 50)
    return {
      dot: 'border-safe bg-safe/20',
      bar: 'bg-safe',
      text: 'text-safe',
    }
  if (sanity > 20)
    return {
      dot: 'border-warning bg-warning/20',
      bar: 'bg-warning',
      text: 'text-warning',
    }
  return {
    dot: 'border-danger bg-danger/20',
    bar: 'bg-danger',
    text: 'text-danger',
  }
}
