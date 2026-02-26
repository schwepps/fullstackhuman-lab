'use client'

import { useTranslations } from 'next-intl'
import { ChatMessageList } from '@/components/chat/chat-message-list'
import { ChatInput } from '@/components/chat/chat-input'
import { ConversationEndActions } from '@/components/chat/conversation-end-actions'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ERROR_MESSAGE_KEYS } from '@/lib/constants/chat'
import type { ChatMessage, FileAttachment, PersonaId } from '@/types/chat'
import type { TierKey } from '@/lib/constants/quotas'

interface ChatContainerProps {
  messages: ChatMessage[]
  persona: PersonaId
  isStreaming: boolean
  error: string | null
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void
  onStopStreaming: () => void
  onDismissError: () => void
  quotaTier: TierKey
  quotaRemaining: number | null
  quotaLimit: number | null
  isReadOnly?: boolean
  shareToken?: string | null
  getTotalAttachmentBytes: () => number
  turnsRemaining?: number | null
  onStartNew?: () => void
}

export function ChatContainer({
  messages,
  persona,
  isStreaming,
  error,
  onSendMessage,
  onStopStreaming,
  onDismissError,
  quotaTier,
  quotaRemaining,
  quotaLimit,
  isReadOnly = false,
  shareToken = null,
  getTotalAttachmentBytes,
  turnsRemaining,
  onStartNew,
}: ChatContainerProps) {
  const t = useTranslations('chat.errors')
  const tConv = useTranslations('conversations')

  return (
    <div
      className="flex flex-1 flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {error && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGE_KEYS[error] ?? 'genericError')}
            </p>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDismissError}
              aria-label={t('dismiss')}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <ChatMessageList
        messages={messages}
        persona={persona}
        isStreaming={isStreaming}
        quotaTier={quotaTier}
        quotaRemaining={quotaRemaining}
        quotaLimit={quotaLimit}
        shareToken={shareToken}
      />

      {isReadOnly ? (
        onStartNew ? (
          <ConversationEndActions onStartNew={onStartNew} />
        ) : (
          <div className="border-t border-border bg-muted/50 px-4 py-3 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              {tConv('readOnlyNotice')}
            </p>
          </div>
        )
      ) : (
        <ChatInput
          onSendMessage={onSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={onStopStreaming}
          getTotalAttachmentBytes={getTotalAttachmentBytes}
          turnsRemaining={turnsRemaining}
        />
      )}
    </div>
  )
}
