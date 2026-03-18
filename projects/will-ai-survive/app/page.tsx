'use client'

import { useRef, useState } from 'react'
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

  async function handleSubmit(situation: string) {
    setSubmittedSituation(situation)
    await evaluate(situation)
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  function handleReset() {
    reset()
    setSubmittedSituation(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-3xl flex-col justify-center px-4 py-8 sm:py-12">
      {/* Hero */}
      <header className="mb-8 text-center sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Will AI Survive
          <br />
          <span className="text-accent">Your Job?</span>
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Describe your workplace chaos. AI will try to survive it.
        </p>
      </header>

      {/* Input — full form when idle, collapsed case file when active */}
      {!isActive ? (
        <InputForm onSubmit={handleSubmit} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="h-0.75 w-full bg-foreground" />
          <div className="px-5 py-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">
              Case File
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              {submittedSituation}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {isActive && (
        <div ref={resultRef} className="mt-8 sm:mt-10">
          <ResultCard state={state} onReset={handleReset} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 pb-safe">
        <SupportCta />
      </footer>
    </main>
  )
}
