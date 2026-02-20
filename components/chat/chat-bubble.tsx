'use client'

import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/chat/markdown-renderer'
import { ReportCard } from '@/components/chat/report-card'
import { AiAvatar } from '@/components/chat/ai-avatar'
import type { ChatMessage, PersonaId } from '@/types/chat'

interface ChatBubbleProps {
  message: ChatMessage
  persona: PersonaId
}

export function ChatBubble({ message, persona }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  if (!isUser && message.isReport) {
    return <ReportCard content={message.content} persona={persona} />
  }

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && <AiAvatar className="mt-3" />}
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-3 sm:max-w-[75%]',
          isUser ? 'bg-primary/10 text-foreground' : 'text-foreground'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  )
}
