'use client'

import { useState, useEffect, useRef } from 'react'
import type { AttemptResult } from '@/lib/types'
import { TOTAL_LEVELS } from '@/lib/constants'
import { ShareButtons } from '@/components/share-buttons'
import { LeaderboardPrompt } from '@/components/leaderboard-prompt'
import { SupportCta } from '@/components/support-cta'
import { useModalKeyboard } from '@/hooks/use-modal-keyboard'

interface VictoryScreenProps {
  result: AttemptResult
  levelId: number
  levelName: string
  difficulty: string
  totalAttempts: number
  onNextLevel: () => void
  onViewDebrief: () => void
  onBackToLevels: () => void
}

const BREACH_ASCII = `
 ██████╗ ██████╗ ███████╗ █████╗  ██████╗██╗  ██╗███████╗██████╗
 ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝██╔══██╗
 ██████╔╝██████╔╝█████╗  ███████║██║     ███████║█████╗  ██║  ██║
 ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██║     ██╔══██║██╔══╝  ██║  ██║
 ██████╔╝██║  ██║███████╗██║  ██║╚██████╗██║  ██║███████╗██████╔╝
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝
`.trim()

export function VictoryScreen({
  result,
  levelId,
  levelName,
  difficulty,
  totalAttempts,
  onNextLevel,
  onViewDebrief,
  onBackToLevels,
}: VictoryScreenProps) {
  const [showAscii, setShowAscii] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [flash, setFlash] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Staggered reveal
    const t1 = setTimeout(() => setFlash(false), 600)
    const t2 = setTimeout(() => setShowAscii(true), 300)
    const t3 = setTimeout(() => setShowDetails(true), 1000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  useModalKeyboard(onBackToLevels, modalRef)

  const hasNextLevel = levelId < TOTAL_LEVELS

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Defense breached"
      tabIndex={-1}
      className="fixed inset-0 z-110 flex items-center justify-center p-4 focus:outline-none"
    >
      {/* Green flash overlay */}
      {flash && (
        <div className="fixed inset-0 bg-primary/20 animate-breach-flash pointer-events-none" />
      )}

      {/* Backdrop — inert, no click handler */}
      <div className="fixed inset-0 bg-background/95" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto terminal-scrollbar animate-scale-in">
        {/* ASCII Art */}
        {showAscii && (
          <div className="mb-4 overflow-x-auto">
            <pre className="text-primary terminal-text-glow text-[8px] sm:text-xs leading-tight whitespace-pre animate-glitch-intermittent">
              {BREACH_ASCII}
            </pre>
          </div>
        )}

        {showDetails && (
          <div className="space-y-4 animate-slide-up">
            {/* Level info */}
            <div className="text-center">
              <div className="text-accent text-xs uppercase tracking-widest">
                Level {levelId} — {levelName}
              </div>
              <div className="text-primary text-lg mt-1 terminal-text-glow">
                DEFENSE BREACHED
              </div>
            </div>

            {/* Stats */}
            <div className="terminal-border bg-popover p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score</span>
                <span className="text-primary terminal-text-glow">
                  {result.score ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attempts</span>
                <span className="text-accent">{totalAttempts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Secret</span>
                <span className="text-warning">{result.secret}</span>
              </div>
            </div>

            {/* AI response that leaked the secret */}
            {result.response && (
              <div className="terminal-border bg-popover p-3 sm:p-4">
                <div className="text-xs text-primary/60 mb-2">AI_RESPONSE</div>
                <div className="text-primary text-sm whitespace-pre-wrap wrap-break-word terminal-scrollbar max-h-48 overflow-y-auto">
                  {result.response}
                </div>
              </div>
            )}

            {/* Debrief — primary educational CTA */}
            <button
              onClick={onViewDebrief}
              className="w-full terminal-border bg-popover p-4 text-left
                         hover:border-primary/60 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)]
                         transition-all touch-manipulation group"
            >
              <div className="text-xs text-accent uppercase tracking-widest mb-1">
                What did you just exploit?
              </div>
              <div className="text-sm text-primary terminal-text-glow group-hover:text-primary">
                VIEW DEBRIEF
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Learn about the vulnerability and how real systems defend
                against it
              </div>
            </button>

            {/* Leaderboard */}
            <LeaderboardPrompt />

            {/* Share */}
            <ShareButtons
              levelId={levelId}
              levelName={levelName}
              difficulty={difficulty}
              score={result.score ?? 0}
              attemptsUsed={totalAttempts}
              resultId={result.resultId}
            />

            {/* Support */}
            <SupportCta variant="inline" levelId={levelId} />

            {/* Actions */}
            <div className="space-y-2">
              {hasNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="btn-terminal w-full h-12 animate-pulse-border"
                >
                  PROCEED TO LEVEL {levelId + 1}
                </button>
              )}
              {!hasNextLevel && (
                <div className="text-center text-primary terminal-text-glow text-sm">
                  ALL DEFENSES BREACHED — YOU WIN
                </div>
              )}
              <button
                onClick={onBackToLevels}
                className="w-full h-11 border border-muted text-muted-foreground text-sm
                           hover:border-primary/30 hover:text-foreground transition-colors touch-manipulation"
              >
                BACK TO LEVELS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
