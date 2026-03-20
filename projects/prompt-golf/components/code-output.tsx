'use client'

interface CodeOutputProps {
  tokens: string
  code: string | null
  isStreaming: boolean
}

export function CodeOutput({ tokens, code, isStreaming }: CodeOutputProps) {
  const displayCode = code ?? tokens

  if (!displayCode && !isStreaming) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="font-serif text-sm uppercase tracking-wider text-accent/70">
          Generated Code
        </h3>
        {isStreaming && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Writing...
          </span>
        )}
      </div>

      <div className="code-block">
        <pre className="whitespace-pre-wrap break-words">
          <code>{displayCode}</code>
          {isStreaming && (
            <span className="inline-block h-4 w-1.5 animate-pulse bg-accent/60" />
          )}
        </pre>
      </div>
    </div>
  )
}
