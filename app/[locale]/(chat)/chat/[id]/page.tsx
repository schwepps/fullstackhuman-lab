'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { useChat } from '@/lib/hooks/use-chat'
import { useQuota } from '@/lib/hooks/use-quota'
import { useAuth } from '@/lib/hooks/use-auth'
import { ChatPageHeader } from '@/components/chat/chat-page-header'
import { ChatContainer } from '@/components/chat/chat-container'
import { DeleteConversationDialog } from '@/components/chat/delete-conversation-dialog'
import { Button } from '@/components/ui/button'
import type { Conversation } from '@/types/conversation'

export default function ConversationViewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const t = useTranslations('conversations')
  const chat = useChat()
  const quota = useQuota()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoadingConversation, setIsLoadingConversation] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [hasReport, setHasReport] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleLeave = useCallback(() => {
    chat.resetChat()
    router.push('/chat')
  }, [chat, router])

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
        setHasReport(data.hasReport)
        await chat.loadConversation(data)
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
        onReset={handleLeave}
        hasMessages={chat.messages.length > 1}
        remaining={quota.remaining}
        limit={quota.limit}
        period={quota.period}
        isLoading={quota.isLoading}
        isReadOnly={chat.isReadOnly}
        actions={
          chat.isReadOnly ? (
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={() => setDeleteOpen(true)}
              className="touch-manipulation"
              aria-label={t('deleteSubmit')}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : undefined
        }
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
          shareToken={chat.shareToken}
        />
      )}

      <DeleteConversationDialog
        conversationId={params.id}
        hasReport={hasReport}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleLeave}
      />
    </>
  )
}
