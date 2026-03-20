'use client'

import type { Evidence } from '@/lib/types'
import { EVIDENCE_TYPE_LABELS } from '@/lib/constants'

interface EvidenceCardProps {
  evidence: Evidence
  showPrompt?: boolean
}

const EVIDENCE_CLASS_MAP: Record<string, string> = {
  slack: 'evidence-slack',
  linkedin: 'evidence-linkedin',
  email: 'evidence-email',
  meeting: 'evidence-meeting',
  expense: 'evidence-expense',
}

export function EvidenceCard({
  evidence,
  showPrompt = false,
}: EvidenceCardProps) {
  const typeLabel = EVIDENCE_TYPE_LABELS[evidence.evidenceType]
  const cardClass = EVIDENCE_CLASS_MAP[evidence.evidenceType] ?? 'evidence-card'

  return (
    <article
      className="animate-[slide-up_0.3s_ease-out]"
      aria-label={`${typeLabel} evidence by ${evidence.accuserName} against ${evidence.suspectName}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">{typeLabel}</span>
        <span className="text-muted-foreground">
          {evidence.accuserName} vs {evidence.suspectName}
        </span>
      </div>

      {/* Generated evidence */}
      <div className={cardClass}>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {evidence.generatedEvidence}
        </pre>
      </div>

      {/* Prompt (shown after verdict) */}
      {showPrompt && (
        <div className="mt-2 rounded-md bg-surface p-2">
          <p className="text-xs text-muted-foreground">
            Prompt ({evidence.wordCount} words):
          </p>
          <p className="text-sm italic text-foreground">
            &ldquo;{evidence.prompt}&rdquo;
          </p>
        </div>
      )}
    </article>
  )
}
