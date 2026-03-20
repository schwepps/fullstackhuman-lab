'use client'

import { useState } from 'react'
import { countWords } from '@/lib/word-counter'
import { MAX_PROMPT_WORDS } from '@/lib/constants'
import { useEvidenceStream } from '@/hooks/use-evidence-stream'

interface DefenseFormProps {
  defenderId: string
  onComplete?: () => void
}

export function DefenseForm({ defenderId, onComplete }: DefenseFormProps) {
  const [prompt, setPrompt] = useState('')
  const { status, evidence, error, submitDefense, reset } = useEvidenceStream()

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > MAX_PROMPT_WORDS
  const canSubmit =
    prompt.trim().length > 0 && !isOverLimit && status === 'idle'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    await submitDefense(defenderId, prompt.trim())
    onComplete?.()
  }

  if (status === 'streaming' || status === 'complete') {
    return (
      <div className="card border-accent p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {status === 'streaming' ? 'Generating Alibi...' : 'Alibi Generated'}
        </p>
        <div className="evidence-card border-l-accent bg-surface">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {evidence}
            {status === 'streaming' && (
              <span className="inline-block w-2 animate-[evidence-typewriter_0.5s_step-end_infinite] border-r-2 border-accent">
                &nbsp;
              </span>
            )}
          </pre>
        </div>
        {status === 'complete' && (
          <button
            type="button"
            onClick={reset}
            className="btn btn-secondary mt-3"
          >
            Done
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card border-accent p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-accent">
        Defend Yourself
      </h3>

      <div className="mb-3">
        <label
          htmlFor="defense-prompt"
          className="mb-1 block text-xs font-semibold text-muted-foreground"
        >
          Your alibi prompt (max {MAX_PROMPT_WORDS} words)
        </label>
        <textarea
          id="defense-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Generate a timestamped calendar showing I was in a meeting..."
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-describedby="defense-word-count"
        />
        <p
          id="defense-word-count"
          className={`mt-1 text-xs ${isOverLimit ? 'text-danger' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {wordCount}/{MAX_PROMPT_WORDS} words
        </p>
      </div>

      {error && (
        <p className="mb-3 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn w-full bg-accent text-background hover:bg-accent/80"
      >
        Generate Alibi
      </button>
    </form>
  )
}
