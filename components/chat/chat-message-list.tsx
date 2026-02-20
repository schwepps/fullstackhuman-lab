'use client'

import { useEffect, useRef } from 'react'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { AiAvatar } from '@/components/chat/ai-avatar'
import type { ChatMessage, PersonaId } from '@/types/chat'

interface ChatMessageListProps {
  messages: ChatMessage[]
  persona: PersonaId
  isStreaming: boolean
}

export function ChatMessageList({
  messages,
  persona,
  isStreaming,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-scrollbar flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} persona={persona} />
        ))}
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
