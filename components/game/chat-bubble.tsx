'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/game/types'

type TypingPlayer = {
  playerId: string
  displayName: string
}

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
      className="max-h-48 w-full overflow-y-auto border border-[#1e293b] font-mono lg:max-w-xs"
      style={{ backgroundColor: 'rgba(10, 10, 12, 0.85)' }}
      ref={scrollRef}
    >
      {recent.length === 0 && typingPlayers.length === 0 ? (
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
          {typingPlayers.map((tp) => (
            <div key={`typing-${tp.playerId}`} className="text-base sm:text-sm">
              <span className="font-bold text-[#4ade80]">{tp.displayName}</span>
              <span className="text-[#94a3b8]"> </span>
              <span className="typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
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
        @keyframes dotPulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }
        .typing-dots {
          display: inline-flex;
          gap: 2px;
          align-items: center;
        }
        .dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #4ade80;
          animation: dotPulse 600ms infinite;
        }
        .dot:nth-child(2) {
          animation-delay: 200ms;
        }
        .dot:nth-child(3) {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  )
}
