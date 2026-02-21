'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useChat } from '@/lib/hooks/use-chat'
import { useQuota } from '@/lib/hooks/use-quota'
import { ChatPageHeader } from '@/components/chat/chat-page-header'
import { PersonaSelector } from '@/components/chat/persona-selector'
import { ChatContainer } from '@/components/chat/chat-container'
import {
  PERSONA_TRIGGER_KEYS,
  PERSONA_OPENING_MESSAGE_KEYS,
} from '@/lib/constants/personas'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import type { PersonaId } from '@/types/chat'

export default function ChatPage() {
  const t = useTranslations('chat')
  const chat = useChat()
  const quota = useQuota()
  const { trackPersonaSelected } = useAnalytics()
  const { refetch: refetchQuota } = quota
  const { isStreaming } = chat

  // Refetch quota when streaming ends (conversation may have been recorded)
  const prevStreamingRef = useRef(false)
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      refetchQuota()
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming, refetchQuota])

  function handleSelectPersona(id: PersonaId) {
    trackPersonaSelected({ persona: id })
    chat.selectPersona(
      id,
      t(PERSONA_OPENING_MESSAGE_KEYS[id]),
      t(PERSONA_TRIGGER_KEYS[id])
    )
  }

  const persona = chat.persona

  return (
    <>
      <ChatPageHeader
        persona={persona}
        onReset={chat.resetChat}
        hasMessages={chat.messages.length > 1}
        remaining={quota.remaining}
        limit={quota.limit}
        period={quota.period}
        isLoading={quota.isLoading}
      />

      {chat.phase === 'selection' ? (
        <PersonaSelector
          onSelect={handleSelectPersona}
          remaining={quota.remaining}
          limit={quota.limit}
          period={quota.period}
          isLoading={quota.isLoading}
        />
      ) : persona ? (
        <ChatContainer
          messages={chat.messages}
          persona={persona}
          isStreaming={chat.isStreaming}
          error={chat.error}
          onSendMessage={chat.sendMessage}
          onStopStreaming={chat.stopStreaming}
          onDismissError={chat.dismissError}
        />
      ) : null}
    </>
  )
}
