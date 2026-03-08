'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage, TypingPlayer } from '@/lib/game/types'

type ChatBubbleProps = {
  messages: ChatMessage[]
  typingPlayers?: TypingPlayer[]
}

export function ChatBubble({ messages, typingPlayers = [] }: ChatBubbleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(0)

  // Auto-scroll on new messages or typing changes
  useEffect(() => {
    if (messages.length > lastCount.current || typingPlayers.length > 0) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
    lastCount.current = messages.length
  }, [messages.length, typingPlayers.length])

  const recent = messages.slice(-10)

  return (
    <div
      className="max-h-48 w-full overflow-y-auto border border-border bg-background/85 font-mono lg:max-w-xs"
      ref={scrollRef}
    >
      {recent.length === 0 && typingPlayers.length === 0 ? (
        <p className="p-2 text-base text-muted-foreground sm:text-sm">
          {'> No messages yet...'}
        </p>
      ) : (
        <div className="flex flex-col gap-0.5 p-2">
          {recent.map((msg) => (
            <div
              key={msg.id}
              className="text-base sm:text-sm"
              style={{
                animation: 'chatFade 500ms 30s forwards',
              }}
            >
              <span className="font-bold text-accent">{msg.displayName}</span>
              <span className="text-muted-foreground">{' > '}</span>
              <span className="text-foreground">{msg.content}</span>
            </div>
          ))}
          {typingPlayers.map((tp) => (
            <div key={`typing-${tp.playerId}`} className="text-base sm:text-sm">
              <span className="font-bold text-accent">{tp.displayName}</span>
              <span className="text-muted-foreground"> </span>
              <span className="typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
