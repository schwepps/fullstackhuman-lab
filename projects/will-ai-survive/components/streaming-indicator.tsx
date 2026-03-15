'use client'

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-3 px-2 py-4">
      <div className="flex gap-1">
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-corporate/60 [animation-delay:0ms]" />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-corporate/60 [animation-delay:150ms]" />
        <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-corporate/60 [animation-delay:300ms]" />
      </div>
      <span className="font-mono text-xs text-muted">
        AI is still writing...
      </span>
    </div>
  )
}
