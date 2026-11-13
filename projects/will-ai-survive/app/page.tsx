'use client'

import { useEffect, useRef, useState } from 'react'
import { HeroPreview } from '@/components/hero-preview'
import { InputForm } from '@/components/input-form'
import { ResultCard } from '@/components/result-card'
import { SupportCta } from '@/components/support-cta'
import { useEvaluation } from '@/hooks/use-evaluation'

export default function Home() {
  const { state, evaluate, reset } = useEvaluation()
  const resultRef = useRef<HTMLDivElement>(null)
  const [submittedSituation, setSubmittedSituation] = useState<string | null>(
    null
  )

  const isActive = state.status !== 'idle'
  const isBusy = state.status === 'loading' || state.status === 'streaming'
  const hasReport = state.chaosData != null

  // Scroll once the report has content: while loading, the page is too short to reach it
  useEffect(() => {
    if (hasReport) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hasReport])

  function handleSubmit(situation: string) {
    setSubmittedSituation(situation)
    void evaluate(situation)
  }

  function handleReset() {
    reset()
    setSubmittedSituation(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="grid gap-7 pt-8 pb-9 lg:grid-cols-[6fr_5fr] lg:items-center lg:gap-12 lg:pt-14 lg:pb-16">
        <div>
          <p className="pixel mb-3.5 text-magenta">Lab experiment</p>
          <h1 className="mb-5 font-display text-[clamp(3.25rem,9vw,6rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-balance">
            Will AI survive your job?
          </h1>
          <p className="max-w-lg text-[1.1875rem] leading-snug lg:text-2xl">
            Invite an AI to your workweek. It takes your job, your meetings and
            your inbox, and you watch its calendar fall apart.
          </p>
        </div>
        <HeroPreview />
      </section>

      <InputForm onSubmit={handleSubmit} isBusy={isBusy} />

      {isActive && (
        <div ref={resultRef} className="scroll-mt-18 pt-12 pb-16">
          <ResultCard
            state={state}
            situation={submittedSituation}
            onReset={handleReset}
          />
        </div>
      )}

      <div className="py-10">
        <SupportCta />
      </div>
    </main>
  )
}
