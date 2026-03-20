'use client'

import { useState } from 'react'
import { countWords } from '@/lib/word-counter'
import { MAX_PROMPT_WORDS, EVIDENCE_TYPE_LABELS } from '@/lib/constants'
import type { EvidenceType } from '@/lib/types'
import type { Member } from '@/lib/types'
import { MEMBERS } from '@/lib/members'
import { useEvidenceStream } from '@/hooks/use-evidence-stream'

interface EvidenceFormProps {
  accuserId: string
  onComplete?: () => void
}

const EVIDENCE_TYPES: EvidenceType[] = [
  'slack',
  'linkedin',
  'email',
  'meeting',
  'expense',
]

export function EvidenceForm({ accuserId, onComplete }: EvidenceFormProps) {
  const [prompt, setPrompt] = useState('')
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('slack')
  const [suspectId, setSuspectId] = useState('')
  const { status, evidence, error, submitEvidence, reset } = useEvidenceStream()

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > MAX_PROMPT_WORDS
  const canSubmit =
    prompt.trim().length > 0 &&
    !isOverLimit &&
    suspectId !== '' &&
    status === 'idle'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    await submitEvidence(accuserId, suspectId, prompt.trim(), evidenceType)
    onComplete?.()
  }

  if (status === 'streaming' || status === 'complete') {
    return (
      <div className="card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          {status === 'streaming'
            ? 'Generating Evidence...'
            : 'Evidence Generated'}
        </p>
        <div className={`evidence-${evidenceType}`}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {evidence}
            {status === 'streaming' && (
              <span className="inline-block w-2 animate-[evidence-typewriter_0.5s_step-end_infinite] border-r-2 border-primary">
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
            Submit More Evidence
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
        File Evidence
      </h3>

      {/* Suspect selector */}
      <div className="mb-3">
        <label
          htmlFor="suspect-select"
          className="mb-1 block text-xs font-semibold text-muted-foreground"
        >
          Who are you accusing?
        </label>
        <select
          id="suspect-select"
          value={suspectId}
          onChange={(e) => setSuspectId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a suspect...</option>
          {MEMBERS.filter((m) => m.id !== accuserId).map((m: Member) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.role}
            </option>
          ))}
        </select>
      </div>

      {/* Evidence type */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">
          Evidence Type
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Evidence type"
        >
          {EVIDENCE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={evidenceType === type}
              onClick={() => setEvidenceType(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium touch-manipulation transition-colors ${
                evidenceType === type
                  ? 'bg-primary text-background'
                  : 'bg-surface text-muted-foreground hover:bg-surface-hover'
              }`}
            >
              {EVIDENCE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div className="mb-3">
        <label
          htmlFor="evidence-prompt"
          className="mb-1 block text-xs font-semibold text-muted-foreground"
        >
          Your prompt (max {MAX_PROMPT_WORDS} words)
        </label>
        <textarea
          id="evidence-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., As the office printer, describe the suspect's suspicious print jobs..."
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-describedby="word-count"
        />
        <p
          id="word-count"
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
        className="btn btn-primary w-full"
      >
        Generate Evidence
      </button>
    </form>
  )
}
