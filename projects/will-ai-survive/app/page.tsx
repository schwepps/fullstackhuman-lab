'use client'

import { useRef, useState } from 'react'
import { InputForm } from '@/components/input-form'
import { ResultCard } from '@/components/result-card'
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
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col px-4 py-8 sm:py-16">
      {/* Hero */}
      <header className="mb-8 text-center sm:mb-12">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-corporate sm:text-4xl">
          WILL AI SURVIVE
          <br />
          <span className="text-danger">YOUR JOB?</span>
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Describe your workplace chaos. AI will try to survive it.
        </p>
      </header>

      {/* Input — full form when idle, collapsed summary when active */}
      {!isActive ? (
        <InputForm onSubmit={handleSubmit} />
      ) : (
        <div className="card-dim border-l-4 border-l-corporate p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Case File
          </p>
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed">
            {submittedSituation}
          </p>
        </div>
      )}

      {/* Results */}
      {isActive && (
        <div ref={resultRef} className="mt-8 sm:mt-12">
          <ResultCard state={state} onReset={handleReset} />
        </div>
      )}
    </main>
  )
}
