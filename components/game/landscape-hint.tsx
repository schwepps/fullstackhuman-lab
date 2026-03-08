'use client'

import { useState } from 'react'

export function LandscapeHint() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded border border-[#22d3ee]/40 bg-[#0a0a0c]/95 px-4 py-3 font-mono text-sm text-[#22d3ee] backdrop-blur-sm portrait:flex landscape:hidden">
      <span>↻ ROTATE FOR OPTIMAL EXPERIENCE</span>
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center text-[#94a3b8] active:text-[#22d3ee] touch-manipulation"
        onClick={() => setIsDismissed(true)}
        aria-label="Dismiss rotation hint"
      >
        ✕
      </button>
    </div>
  )
}
