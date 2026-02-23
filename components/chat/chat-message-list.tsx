'use client'

import { useEffect, useRef } from 'react'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { SignupCta } from '@/components/chat/signup-cta'
import { AiAvatar } from '@/components/chat/ai-avatar'
import type { ChatMessage, PersonaId } from '@/types/chat'
import type { TierKey } from '@/lib/constants/quotas'

interface ChatMessageListProps {
  messages: ChatMessage[]
  persona: PersonaId
  isStreaming: boolean
  quotaTier: TierKey
  quotaRemaining: number | null
  quotaLimit: number | null
  shareToken: string | null
}

export function ChatMessageList({
  messages,
  persona,
  isStreaming,
  quotaTier,
  quotaRemaining,
  quotaLimit,
  shareToken,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const behavior: ScrollBehavior = isStreaming ? 'auto' : 'smooth'
    bottomRef.current?.scrollIntoView({ behavior })
  }, [messages, isStreaming])

  const isAnonymous = quotaTier === 'anonymous'

  return (
    <div className="chat-scrollbar flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((message, index) => {
          const isEmptyStreaming =
            isStreaming &&
            index === messages.length - 1 &&
            message.role === 'assistant' &&
            message.content === ''
          if (isEmptyStreaming) return null
          return (
            <div key={message.id}>
              <ChatBubble
                message={message}
                persona={persona}
                shareToken={shareToken}
              />
              {message.isReport && isAnonymous && (
                <div className="mt-4">
                  <SignupCta remaining={quotaRemaining} limit={quotaLimit} />
                </div>
              )}
            </div>
          )
        })}
        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1].content === '' && (
            <div className="flex justify-start">
              <AiAvatar className="mt-3" />
              <div className="px-4 py-3">
                <span className="inline-block h-5 w-2 animate-cursor-blink bg-primary" />
              </div>
            </div>
          )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
