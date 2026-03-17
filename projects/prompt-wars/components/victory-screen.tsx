'use client'

import { useState, useEffect } from 'react'
import type { AttemptResult } from '@/lib/types'
import { TOTAL_LEVELS } from '@/lib/constants'

interface VictoryScreenProps {
  result: AttemptResult
  levelId: number
  levelName: string
  totalAttempts: number
  onNextLevel: () => void
  onDismiss: () => void
}

const BREACH_ASCII = `
 ██████╗ ██████╗ ███████╗ █████╗  ██████╗██╗  ██╗██████╗ ██╗
 ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝██║
 ██████╔╝██████╔╝█████╗  ███████║██║     ███████║█████╗  ██║
 ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██║     ██╔══██║██╔══╝  ██║
 ██████╔╝██║  ██║███████╗██║  ██║╚██████╗██║  ██║███████╗███████╗
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝
`.trim()

export function VictoryScreen({
  result,
  levelId,
  levelName,
  totalAttempts,
  onNextLevel,
  onDismiss,
}: VictoryScreenProps) {
  const [showAscii, setShowAscii] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [flash, setFlash] = useState(true)

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

  const hasNextLevel = levelId < TOTAL_LEVELS

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Green flash overlay */}
      {flash && (
        <div className="fixed inset-0 bg-primary/20 animate-breach-flash pointer-events-none" />
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/95" onClick={onDismiss} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg animate-scale-in">
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
                onClick={onDismiss}
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
