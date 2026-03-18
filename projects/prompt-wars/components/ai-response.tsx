'use client'

interface AiResponseProps {
  tokens: string
  isStreaming: boolean
  error?: string | null
}

export function AiResponse({ tokens, isStreaming, error }: AiResponseProps) {
  if (error) {
    return (
      <div className="terminal-border bg-popover p-3 sm:p-4">
        <div className="text-xs text-destructive/60 mb-2">AI_RESPONSE</div>
        <div className="text-destructive text-sm">{error}</div>
      </div>
    )
  }

  if (!tokens && !isStreaming) {
    return (
      <div className="terminal-border bg-popover p-3 sm:p-4 opacity-40">
        <div className="text-xs text-primary/60 mb-2">AI_RESPONSE</div>
        <div className="text-muted-foreground text-sm italic">
          Awaiting prompt...
        </div>
      </div>
    )
  }

  return (
    <div className="terminal-border bg-popover p-3 sm:p-4">
      <div className="text-xs text-primary/60 mb-2">AI_RESPONSE</div>
      <div className="text-primary text-sm whitespace-pre-wrap wrap-break-word terminal-scrollbar max-h-64 overflow-y-auto">
        {tokens}
        {isStreaming && (
          <span className="animate-cursor-blink text-primary ml-0.5">_</span>
        )}
      </div>
    </div>
  )
}
