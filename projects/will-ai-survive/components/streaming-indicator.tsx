'use client'

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-3 px-2 py-4">
      <div className="flex gap-1">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent/50 [animation-delay:0ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent/50 [animation-delay:150ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent/50 [animation-delay:300ms]" />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        AI is still writing...
      </span>
    </div>
  )
}
