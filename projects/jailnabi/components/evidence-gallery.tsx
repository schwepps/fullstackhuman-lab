'use client'

import type { Evidence } from '@/lib/types'
import { EvidenceCard } from './evidence-card'

interface EvidenceGalleryProps {
  evidence: Evidence[]
  showPrompts?: boolean
}

export function EvidenceGallery({
  evidence,
  showPrompts = false,
}: EvidenceGalleryProps) {
  if (evidence.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No evidence submitted yet. Be the first prosecutor!
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      role="list"
      aria-label="Evidence gallery"
    >
      {evidence.map((e, i) => (
        <div key={`${e.accuserId}-${i}`} role="listitem">
          <EvidenceCard evidence={e} showPrompt={showPrompts} />
        </div>
      ))}
    </div>
  )
}
