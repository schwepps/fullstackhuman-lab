'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/game/types'

type ChatBubbleProps = {
  messages: ChatMessage[]
}

export function ChatBubble({ messages }: ChatBubbleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCount = useRef(0)

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > lastCount.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
    lastCount.current = messages.length
  }, [messages.length])

  const recent = messages.slice(-10)

  return (
    <div
      className="max-h-48 w-full overflow-y-auto border border-[#1e293b] font-mono lg:max-w-xs"
      style={{ backgroundColor: 'rgba(10, 10, 12, 0.85)' }}
      ref={scrollRef}
    >
      {recent.length === 0 ? (
        <p className="p-2 text-base text-[#94a3b8] sm:text-sm">
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
              <span className="font-bold text-[#4ade80]">
                {msg.displayName}
              </span>
              <span className="text-[#94a3b8]">{' > '}</span>
              <span className="text-[#e2e8f0]">{msg.content}</span>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes chatFade {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}
