'use client'

import { getLevel } from '@/lib/levels'

interface DefenseExplainerProps {
  levelId: number
  onClose: () => void
}

export function DefenseExplainer({ levelId, onClose }: DefenseExplainerProps) {
  const level = getLevel(levelId)
  if (!level) return null

  const { education } = level

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/90" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg animate-slide-up bg-popover border border-primary/30 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-accent text-xs uppercase tracking-widest">
            DEBRIEF — Level {levelId}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors touch-manipulation h-8 w-8 flex items-center justify-center"
          >
            [x]
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto terminal-scrollbar">
          <h3 className="text-primary terminal-text-glow text-sm">
            {education.title}
          </h3>

          <div>
            <div className="text-xs text-accent mb-1 uppercase tracking-wider">
              What you exploited
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {education.vulnerability}
            </p>
          </div>

          <div>
            <div className="text-xs text-warning mb-1 uppercase tracking-wider">
              How real systems defend against this
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {education.realWorldDefense}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="btn-terminal w-full h-11 text-sm"
          >
            UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  )
}
