'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useChat } from '@/lib/hooks/use-chat'
import { useQuota } from '@/lib/hooks/use-quota'
import { ChatPageHeader } from '@/components/chat/chat-page-header'
import { PersonaSelector } from '@/components/chat/persona-selector'
import { ChatContainer } from '@/components/chat/chat-container'
import {
  PERSONA_IDS,
  PERSONA_TRIGGER_KEYS,
  PERSONA_OPENING_MESSAGE_KEYS,
} from '@/lib/constants/personas'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import type { PersonaId } from '@/types/chat'

function ChatPageContent() {
  const t = useTranslations('chat')
  const searchParams = useSearchParams()
  const chat = useChat()
  const quota = useQuota()
  const { trackPersonaSelected } = useAnalytics()
  const { refetch: refetchQuota } = quota
  const { isStreaming, phase } = chat

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

  // Auto-select persona from ?persona= query param (used by WebMCP start_consultation)
  const hasAutoSelected = useRef(false)
  useEffect(() => {
    if (hasAutoSelected.current || phase !== 'selection') return
    const param = searchParams.get('persona')
    if (!param || !PERSONA_IDS.includes(param as PersonaId)) return
    hasAutoSelected.current = true
    trackPersonaSelected({ persona: param as PersonaId })
    chat.selectPersona(
      param as PersonaId,
      t(PERSONA_OPENING_MESSAGE_KEYS[param as PersonaId]),
      t(PERSONA_TRIGGER_KEYS[param as PersonaId])
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, phase])

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
          quotaTier={quota.tier}
          quotaRemaining={quota.remaining}
          quotaLimit={quota.limit}
        />
      ) : null}
    </>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageContent />
    </Suspense>
  )
}
