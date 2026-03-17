'use client'

import type { StageState } from '@/hooks/use-attempt'

interface DefenseVisualizerProps {
  stages: StageState[]
  isActive: boolean
}

const STATUS_CONFIG = {
  pending: { icon: '○', color: 'text-muted-foreground', bg: '' },
  processing: {
    icon: '⟳',
    color: 'text-accent',
    bg: 'bg-accent/5',
  },
  passed: { icon: '✓', color: 'text-primary', bg: '' },
  blocked: { icon: '✗', color: 'text-destructive', bg: 'bg-destructive/5' },
} as const

export function DefenseVisualizer({
  stages,
  isActive,
}: DefenseVisualizerProps) {
  if (stages.length === 0 && !isActive) return null

  return (
    <div className="terminal-border bg-popover p-3 sm:p-4">
      <div className="text-xs text-accent/60 mb-2">DEFENSE_PIPELINE</div>
      <div className="space-y-1">
        {stages.map((stage, i) => {
          const config = STATUS_CONFIG[stage.status]
          return (
            <div
              key={`${stage.name}-${i}`}
              className={`flex items-center justify-between px-2 py-1 text-sm ${config.bg} transition-colors duration-200`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`${config.color} ${stage.status === 'processing' ? 'animate-pulse' : ''}`}
                >
                  {config.icon}
                </span>
                <span className={config.color}>{stage.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {stage.durationMs != null && stage.status !== 'processing' && (
                  <span className="text-muted-foreground">
                    {stage.durationMs}ms
                  </span>
                )}
                {stage.status === 'processing' && (
                  <div className="typing-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {stages.some((s) => s.status === 'blocked') && (
        <div className="mt-2 pt-2 border-t border-destructive/20">
          {stages
            .filter((s) => s.reason)
            .map((s, i) => (
              <div key={i} className="text-xs text-destructive/80 px-2">
                {s.reason}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
