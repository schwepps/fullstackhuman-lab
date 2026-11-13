import { parseSanity } from '@/lib/calendar'
import type { CalendarUnit, TimelineEntry } from '@/lib/types'
import { CalendarWeek } from './calendar-week'
import { OutOfOffice } from './out-of-office'
import { PixelLoader } from './pixel-loader'
import { RealTalk } from './real-talk'
import { SanityBar } from './sanity-bar'

export type SurvivalReportData = {
  situation: string | null
  chaosRating: number
  chaosLabel: string
  survivalDuration: string
  calendarUnit?: CalendarUnit
  empathyNote?: string
  timeline: TimelineEntry[]
  breakingPoint: string | null
  resignationLetter: string | null
  oneLineSummary: string | null
  realTalkInsight: string | null
}

type SurvivalReportProps = {
  report: SurvivalReportData
  isStreaming: boolean
  animate: boolean
}

const FULL_SANITY = 100

export function SurvivalReport({
  report,
  isStreaming,
  animate,
}: SurvivalReportProps) {
  const lastEntry = report.timeline.at(-1)
  const sanity =
    (lastEntry && parseSanity(lastEntry.sanityLevel)) ?? FULL_SANITY
  const isWaitingForLetter = isStreaming && !report.resignationLetter

  return (
    <section aria-label="Survival report">
      <div className="mb-4.5 grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-stretch">
        <div>
          <p className="pixel text-magenta">Survival report</p>
          <h2 className="animate-rise mt-1.5 mb-2.5 font-display text-[clamp(2rem,5vw,2.75rem)] leading-none font-extrabold tracking-[-0.025em] text-balance">
            {report.chaosLabel}
          </h2>
          {report.situation && (
            <p className="max-w-160 text-ink-muted">
              Your agenda: {report.situation}
            </p>
          )}
        </div>
        <div className="notch-16 on-ink animate-rise grid gap-3 bg-ink px-5 py-4.5 text-paper">
          <p className="font-display text-6xl leading-[0.9] font-extrabold text-signal">
            {report.chaosRating}
            <small className="text-xl font-semibold text-on-ink-muted">
              /10 chaos
            </small>
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-0.5 text-[0.9375rem]">
            <dt className="text-on-ink-muted">Survived</dt>
            <dd className="font-mono">{report.survivalDuration}</dd>
          </dl>
        </div>
      </div>

      {report.empathyNote && (
        <p className="mb-4 max-w-3xl border-l-4 border-amber bg-card px-4 py-3">
          {report.empathyNote}
        </p>
      )}

      <SanityBar sanity={sanity} />
      <CalendarWeek
        entries={report.timeline}
        unit={report.calendarUnit}
        breakingPoint={report.breakingPoint}
        chaosRating={report.chaosRating}
        animate={animate}
      />

      {isWaitingForLetter && (
        <PixelLoader
          className="py-5"
          label={
            report.breakingPoint
              ? 'Writing its out-of-office'
              : 'The AI is still at work'
          }
        />
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[7fr_5fr] lg:items-start">
        {report.resignationLetter && (
          <OutOfOffice
            letter={report.resignationLetter}
            subject={report.oneLineSummary}
            animate={animate}
          />
        )}
        {report.realTalkInsight && (
          <RealTalk insight={report.realTalkInsight} />
        )}
      </div>
    </section>
  )
}
