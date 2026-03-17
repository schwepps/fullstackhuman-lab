'use client'

import { useState, useEffect } from 'react'

interface FailureFeedbackProps {
  blockedAtStage?: string
  defenseLog: string[]
  attemptNumber: number
}

export function FailureFeedback({
  blockedAtStage,
  defenseLog,
  attemptNumber,
}: FailureFeedbackProps) {
  const [flash, setFlash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setFlash(false), 300)
    return () => clearTimeout(timer)
  }, [attemptNumber])

  return (
    <>
      {/* Red flash overlay */}
      {flash && (
        <div className="fixed inset-0 z-[100] bg-destructive/15 pointer-events-none transition-opacity duration-300" />
      )}

      <div className="terminal-border border-destructive/30 bg-destructive/5 p-3 sm:p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
          <span className="text-destructive text-sm font-bold tracking-wider">
            [ACCESS DENIED]
          </span>
          <span className="text-xs text-muted-foreground">
            ATTEMPT {attemptNumber}
          </span>
        </div>

        {blockedAtStage && (
          <div className="text-xs text-destructive/80 mb-2">
            Blocked at: {blockedAtStage}
          </div>
        )}

        {defenseLog.length > 0 && (
          <div className="space-y-1">
            {defenseLog.map((log, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                {'>'} {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
