import {
  assignPeriods,
  parseSanity,
  periodLabel,
  sanityTone,
  tiltDegrees,
  type SanityTone,
} from '@/lib/calendar'
import type { CalendarUnit, TimelineEntry } from '@/lib/types'

const TONE_CLASSES: Record<SanityTone | 'break' | 'calm', string> = {
  ok: 'bg-[color-mix(in_oklab,var(--color-green)_45%,white)]',
  warn: 'bg-[color-mix(in_oklab,var(--color-amber)_50%,white)]',
  bad: 'bg-[color-mix(in_oklab,var(--color-glitch)_22%,white)] shadow-[inset_4px_0_0_var(--color-glitch)]',
  break: 'bg-magenta text-paper',
  calm: 'bg-ink text-paper',
}
const CALM_MAX_RATING = 3

type CalendarWeekProps = {
  entries: TimelineEntry[]
  unit?: CalendarUnit
  breakingPoint: string | null
  chaosRating: number
  animate: boolean
}

export function CalendarWeek(props: CalendarWeekProps) {
  const { entries, unit, breakingPoint, chaosRating, animate } = props
  const periods = assignPeriods(entries)
  const columns = Math.max(1, ...periods)
  const isCalm = chaosRating <= CALM_MAX_RATING

  return (
    <>
      <p className="pixel mb-2 text-ink-muted">
        {unit ? `${unit} view, ${columns} ${unit}s` : 'Survival log'}
      </p>
      <div
        className="grid grid-cols-1 border-2 border-ink bg-card md:grid-cols-(--cols)"
        style={
          {
            '--cols': `repeat(${columns}, minmax(0, 1fr))`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: columns }, (_, i) => i + 1).map((period) => {
          const inColumn = entries
            .map((entry, index) => ({ entry, index }))
            .filter(({ index }) => periods[index] === period)
          const isLast = period === columns

          return (
            <section
              key={period}
              aria-label={periodLabel(unit, period)}
              className="min-h-21 border-b border-grid-line p-2.5 last:border-0 md:min-h-[28rem] md:border-r md:border-b-0"
            >
              <h3 className="pixel mb-2.5 text-xs text-ink-muted">
                {periodLabel(unit, period)}
              </h3>
              {inColumn.length === 0 && !isLast && (
                <p className="text-sm text-ink-muted italic">
                  Free. Suspiciously free.
                </p>
              )}
              {inColumn.map(({ entry, index }) => (
                <TimelineEvent
                  key={index}
                  entry={entry}
                  index={index}
                  animate={animate}
                />
              ))}
              {isLast && breakingPoint && (
                <div
                  className={`notch-8 mb-2.5 px-3 py-2.5 text-[0.9375rem] leading-snug ${TONE_CLASSES[isCalm ? 'calm' : 'break']} ${animate ? 'animate-drop' : ''}`}
                  style={{ rotate: isCalm ? '0deg' : '4deg' }}
                >
                  <span
                    className={`pixel block text-xs ${isCalm ? 'text-signal' : ''}`}
                  >
                    {isCalm ? 'Closest call' : 'Breaking point'}
                  </span>
                  {breakingPoint}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}

type TimelineEventProps = {
  entry: TimelineEntry
  index: number
  animate: boolean
}

function TimelineEvent({ entry, index, animate }: TimelineEventProps) {
  const sanity = parseSanity(entry.sanityLevel) ?? 50
  return (
    <div
      className={`notch-8 mb-2.5 origin-[12px_0] px-3 py-2.5 text-[0.9375rem] leading-snug ${TONE_CLASSES[sanityTone(sanity)]} ${animate ? 'animate-drop' : ''}`}
      style={{ rotate: `${tiltDegrees(sanity, index).toFixed(2)}deg` }}
    >
      <span className="mb-0.5 flex justify-between gap-2 font-mono text-xs font-semibold">
        {entry.time}
        <span
          className={sanity < 0 ? 'bg-ink px-1.5 text-signal' : 'opacity-75'}
        >
          {entry.sanityLevel}
        </span>
      </span>
      {entry.event}
      {entry.thought && (
        <span className="mt-1.5 block italic opacity-85">
          ({entry.thought})
        </span>
      )}
    </div>
  )
}
