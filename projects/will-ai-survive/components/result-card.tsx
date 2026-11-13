'use client'

import type { EvaluationState } from '@/hooks/use-evaluation'
import { PixelLoader } from './pixel-loader'
import { ShareButtons } from './share-buttons'
import { SurvivalReport } from './survival-report'

type ResultCardProps = {
  state: EvaluationState
  situation: string | null
  onReset: () => void
}

export function ResultCard({ state, situation, onReset }: ResultCardProps) {
  if (state.status === 'error') {
    return (
      <div className="notch-16 animate-rise max-w-3xl border-2 border-magenta bg-card p-6">
        <p className="mb-4 text-magenta">{state.error}</p>
        <button
          onClick={onReset}
          className="notch-8 pixel min-h-12 bg-ink px-6 text-signal"
        >
          Try again
        </button>
      </div>
    )
  }

  if (state.status === 'loading' || !state.chaosData) {
    return <PixelLoader className="py-6" label={state.loadingMessage} />
  }

  return (
    <>
      <SurvivalReport
        animate
        isStreaming={state.status === 'streaming'}
        report={{
          ...state.chaosData,
          situation,
          timeline: state.timelineEntries,
          breakingPoint: state.breakingPoint,
          resignationLetter: state.resignationLetter,
          oneLineSummary: state.oneLineSummary,
          realTalkInsight: state.realTalkInsight,
        }}
      />
      {state.status === 'complete' && state.resultId && (
        <ShareButtons
          resultId={state.resultId}
          chaosRating={state.chaosData.chaosRating}
          chaosLabel={state.chaosData.chaosLabel}
          survivalDuration={state.chaosData.survivalDuration}
          breakingPoint={state.breakingPoint ?? ''}
          onReset={onReset}
        />
      )}
    </>
  )
}
