'use client'

import { useEffect, useRef } from 'react'
import type { EvaluationState } from '@/hooks/use-evaluation'
import { ChaosMeter } from './chaos-meter'
import { Timeline } from './timeline'
import { BreakingPoint } from './breaking-point'
import { ResignationLetter } from './resignation-letter'
import { RealTalk } from './real-talk'
import { ShareButtons } from './share-buttons'
import { StreamingIndicator } from './streaming-indicator'
import { ArrowRightIcon } from './icons'

type ResultCardProps = {
  state: EvaluationState
  onReset: () => void
}

export function ResultCard({ state, onReset }: ResultCardProps) {
  const scrollSentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.status === 'streaming') {
      scrollSentinelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [
    state.status,
    state.timelineEntries.length,
    state.breakingPoint,
    state.resignationLetter,
    state.realTalkInsight,
  ])

  if (state.status === 'error') {
    return (
      <div className="animate-scale-in rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <p className="mb-4 text-accent">{state.error}</p>
        <button
          onClick={onReset}
          className="min-h-11 rounded-lg bg-foreground px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="animate-scale-in rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <p className="animate-pulse text-sm text-muted">
          {state.loadingMessage}
        </p>
      </div>
    )
  }

  const isStreaming = state.status === 'streaming'

  return (
    <div className="flex flex-col gap-6">
      {/* Empathy note */}
      {state.chaosData?.empathyNote && (
        <div className="animate-fade-in rounded-lg border border-warning/20 bg-warning-light p-4">
          <p className="text-sm leading-relaxed text-foreground/80">
            {state.chaosData.empathyNote}
          </p>
        </div>
      )}

      {/* Chaos meter */}
      {state.chaosData && (
        <ChaosMeter
          rating={state.chaosData.chaosRating}
          label={state.chaosData.chaosLabel}
          survivalDuration={state.chaosData.survivalDuration}
        />
      )}

      {isStreaming && state.chaosData && state.timelineEntries.length === 0 && (
        <StreamingIndicator />
      )}

      {state.timelineEntries.length > 0 && (
        <Timeline entries={state.timelineEntries} />
      )}

      {isStreaming &&
        state.timelineEntries.length > 0 &&
        !state.breakingPoint && <StreamingIndicator />}

      {state.breakingPoint && <BreakingPoint content={state.breakingPoint} />}

      {isStreaming && state.breakingPoint && !state.resignationLetter && (
        <StreamingIndicator />
      )}

      {state.resignationLetter && (
        <ResignationLetter content={state.resignationLetter} />
      )}

      {state.realTalkInsight && <RealTalk insight={state.realTalkInsight} />}

      {/* Share + reset */}
      {state.status === 'complete' && state.resultId && (
        <div className="animate-fade-in flex flex-col gap-4">
          <ShareButtons
            resultId={state.resultId}
            chaosRating={state.chaosData?.chaosRating ?? 0}
            chaosLabel={state.chaosData?.chaosLabel ?? ''}
            survivalDuration={state.chaosData?.survivalDuration ?? ''}
            breakingPoint={state.breakingPoint ?? ''}
          />
          <button
            onClick={onReset}
            className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-foreground shadow-sm transition-all hover:border-muted hover:bg-surface-dim hover:shadow-md active:scale-[0.98]"
          >
            Try Another Job
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      )}

      <div ref={scrollSentinelRef} />
    </div>
  )
}
