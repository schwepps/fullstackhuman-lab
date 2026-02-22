'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChat } from '@/lib/hooks/use-chat'
import { useQuota } from '@/lib/hooks/use-quota'
import { useAuth } from '@/lib/hooks/use-auth'
import { ChatPageHeader } from '@/components/chat/chat-page-header'
import { ChatContainer } from '@/components/chat/chat-container'
import type { Conversation } from '@/types/conversation'

export default function ConversationViewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const chat = useChat()
  const quota = useQuota()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoadingConversation, setIsLoadingConversation] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }

    async function loadConversation() {
      try {
        const response = await fetch(`/api/conversations/${params.id}`)
        if (!response.ok) {
          setLoadError(true)
          return
        }
        const data = (await response.json()) as Conversation
        chat.loadConversation(data)
      } catch {
        setLoadError(true)
      } finally {
        setIsLoadingConversation(false)
      }
    }

    loadConversation()
    // Only load once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, params.id])

  if (authLoading || isLoadingConversation) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (loadError) {
    router.replace('/chat')
    return null
  }

  return (
    <>
      <ChatPageHeader
        persona={chat.persona}
        onReset={chat.resetChat}
        hasMessages={chat.messages.length > 1}
        remaining={quota.remaining}
        limit={quota.limit}
        period={quota.period}
        isLoading={quota.isLoading}
        isReadOnly={chat.isReadOnly}
      />

      {chat.persona && (
        <ChatContainer
          messages={chat.messages}
          persona={chat.persona}
          isStreaming={chat.isStreaming}
          error={chat.error}
          onSendMessage={chat.sendMessage}
          onStopStreaming={chat.stopStreaming}
          onDismissError={chat.dismissError}
          quotaTier={quota.tier}
          quotaRemaining={quota.remaining}
          quotaLimit={quota.limit}
          isReadOnly={chat.isReadOnly}
        />
      )}
    </>
  )
}
