'use client'

import { useTranslations } from 'next-intl'
import { useChat } from '@/lib/hooks/use-chat'
import { ChatPageHeader } from '@/components/chat/chat-page-header'
import { PersonaSelector } from '@/components/chat/persona-selector'
import { ChatContainer } from '@/components/chat/chat-container'
import {
  PERSONA_TRIGGER_KEYS,
  PERSONA_OPENING_MESSAGE_KEYS,
} from '@/lib/constants/personas'
import type { PersonaId } from '@/types/chat'

export default function ChatPage() {
  const t = useTranslations('chat')
  const chat = useChat()

  function handleSelectPersona(id: PersonaId) {
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
      />

      {chat.phase === 'selection' ? (
        <PersonaSelector onSelect={handleSelectPersona} />
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
