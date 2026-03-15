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
      <div className="card animate-scale-in p-6 text-center">
        <p className="mb-4 text-danger">{state.error}</p>
        <button onClick={onReset} className="btn-corporate">
          Try Again
        </button>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="card animate-scale-in p-6 text-center">
        <p className="animate-pulse font-mono text-base text-muted sm:text-sm">
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
        <div className="animate-fade-in rounded-xl border border-warning/20 bg-warning/5 p-4">
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

      {/* Streaming indicator: after chaos, before timeline */}
      {isStreaming && state.chaosData && state.timelineEntries.length === 0 && (
        <StreamingIndicator />
      )}

      {/* Timeline */}
      {state.timelineEntries.length > 0 && (
        <Timeline entries={state.timelineEntries} />
      )}

      {/* Streaming indicator: after timeline, before breaking point */}
      {isStreaming &&
        state.timelineEntries.length > 0 &&
        !state.breakingPoint && <StreamingIndicator />}

      {/* Breaking point */}
      {state.breakingPoint && <BreakingPoint content={state.breakingPoint} />}

      {/* Streaming indicator: after breaking point, before resignation */}
      {isStreaming && state.breakingPoint && !state.resignationLetter && (
        <StreamingIndicator />
      )}

      {/* Resignation letter */}
      {state.resignationLetter && (
        <ResignationLetter content={state.resignationLetter} />
      )}

      {/* Real talk */}
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
            className="min-h-11 w-full touch-manipulation border border-border px-4 py-3 font-mono text-sm transition-colors hover:bg-surface-dim active:scale-[0.98]"
          >
            Try Another Job
          </button>
        </div>
      )}

      <div ref={scrollSentinelRef} />
    </div>
  )
}
