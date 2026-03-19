'use client'

interface CompletedLevelBarProps {
  score: number
  attempts: number
  onOpenDebrief: () => void
  onOpenShare: () => void
}

export function CompletedLevelBar({
  score,
  attempts,
  onOpenDebrief,
  onOpenShare,
}: CompletedLevelBarProps) {
  return (
    <div className="terminal-border p-3 flex items-center justify-between gap-3">
      <div className="text-xs">
        <span className="text-primary terminal-text-glow">BREACHED</span>
        <span className="text-muted-foreground ml-2">
          {score}pts — {attempts} attempt
          {attempts !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onOpenDebrief}
          className="h-8 px-3 text-xs text-primary border border-primary/40
                     hover:bg-primary/10 hover:border-primary/60 transition-colors
                     touch-manipulation uppercase tracking-wider terminal-text-glow"
        >
          Debrief
        </button>
        <button
          onClick={onOpenShare}
          className="h-8 px-3 text-xs text-muted-foreground border border-muted/30
                     hover:border-primary/40 hover:text-foreground transition-colors
                     touch-manipulation uppercase tracking-wider"
        >
          Share
        </button>
      </div>
    </div>
  )
}
