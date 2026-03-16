'use client'

import type { TimelineEntry } from '@/lib/types'

type TimelineProps = {
  entries: TimelineEntry[]
}

export function Timeline({ entries }: TimelineProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="h-0.75 w-full bg-accent" />

      <div className="px-5 py-6 sm:px-6">
        <h3 className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Survival Log
        </h3>

        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div className="absolute left-1.75 top-2 bottom-2 w-px bg-border" />

          {entries.map((entry, i) => {
            const sanity = getSanityNumber(entry.sanityLevel)
            const sanityColor = getSanityColor(sanity)

            return (
              <div
                key={`${entry.time}-${i}`}
                className="animate-slide-in relative flex gap-4 pb-6 last:pb-0"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Status dot */}
                <div className="relative z-10 mt-1.5 flex h-3.75 w-3.75 shrink-0 items-center justify-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${sanityColor.dot}`}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {entry.time}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="sanity-gauge hidden w-16 sm:block">
                        <div
                          className={`sanity-gauge-fill ${sanityColor.bar}`}
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

                  <p className="text-sm leading-relaxed text-foreground/90">
                    {entry.event}
                  </p>

                  {entry.thought && (
                    <p className="mt-1.5 text-xs leading-relaxed italic text-muted">
                      ({entry.thought})
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
      dot: 'bg-safe',
      bar: 'bg-safe',
      text: 'text-safe',
    }
  if (sanity > 20)
    return {
      dot: 'bg-warning',
      bar: 'bg-warning',
      text: 'text-warning',
    }
  return {
    dot: 'bg-danger',
    bar: 'bg-danger',
    text: 'text-danger',
  }
}
