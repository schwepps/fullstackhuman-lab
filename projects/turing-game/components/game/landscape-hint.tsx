'use client'

import { useState } from 'react'

export function LandscapeHint() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded border border-primary/40 bg-background/95 px-4 py-3 font-mono text-sm text-primary backdrop-blur-sm portrait:flex landscape:hidden">
      <span>↻ ROTATE FOR OPTIMAL EXPERIENCE</span>
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground active:text-primary touch-manipulation"
        onClick={() => setIsDismissed(true)}
        aria-label="Dismiss rotation hint"
      >
        ✕
      </button>
    </div>
  )
}
