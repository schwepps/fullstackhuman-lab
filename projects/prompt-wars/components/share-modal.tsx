'use client'

import { useRef } from 'react'
import { useModalKeyboard } from '@/hooks/use-modal-keyboard'
import { ShareButtons } from '@/components/share-buttons'

interface ShareModalProps {
  levelId: number
  levelName: string
  difficulty: string
  score: number
  attemptsUsed: number
  resultId?: string
  onClose: () => void
}

export function ShareModal({
  levelId,
  levelName,
  difficulty,
  score,
  attemptsUsed,
  resultId,
  onClose,
}: ShareModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useModalKeyboard(onClose, modalRef)

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Share — Level ${levelId}`}
      tabIndex={-1}
      className="fixed inset-0 z-120 flex items-end sm:items-center justify-center p-0 sm:p-4 focus:outline-none"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-background/90 cursor-default"
        onClick={onClose}
        aria-label="Close share"
      />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg animate-slide-up bg-popover border border-primary/30 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="text-accent text-xs uppercase tracking-widest">
            SHARE — Level {levelId}
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
          <div className="text-sm text-foreground/80">
            <span className="text-primary terminal-text-glow">{levelName}</span>
            {' — '}
            <span className="text-accent">{score}pts</span>
            {' in '}
            <span className="text-muted-foreground">
              {attemptsUsed} attempt{attemptsUsed !== 1 ? 's' : ''}
            </span>
          </div>

          <ShareButtons
            levelId={levelId}
            levelName={levelName}
            difficulty={difficulty}
            score={score}
            attemptsUsed={attemptsUsed}
            resultId={resultId}
            variant="retrospective"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="btn-terminal w-full h-11 text-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
