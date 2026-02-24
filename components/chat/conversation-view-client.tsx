'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Download, ExternalLink, MoreVertical, Trash2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useChat } from '@/lib/hooks/use-chat'
import { useQuota } from '@/lib/hooks/use-quota'
import { ChatPageHeader } from '@/components/chat/chat-page-header'
import { ChatContainer } from '@/components/chat/chat-container'
import { DeleteConversationDialog } from '@/components/chat/delete-conversation-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Conversation } from '@/types/conversation'

interface ConversationViewClientProps {
  conversation: Omit<Conversation, 'userId'>
  shareToken: string | null
}

export function ConversationViewClient({
  conversation,
  shareToken,
}: ConversationViewClientProps) {
  const router = useRouter()
  const t = useTranslations('conversations')
  const chat = useChat()
  const quota = useQuota()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleLeave = useCallback(() => {
    chat.resetChat()
    router.push('/chat')
  }, [chat, router])

  useEffect(() => {
    async function init() {
      await chat.loadConversation(conversation, shareToken)
      setIsLoading(false)
    }
    init()
    // Only load once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="touch-manipulation"
                  aria-label={t('actions')}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {shareToken && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/report/${shareToken}`}>
                        <ExternalLink className="size-4" />
                        {t('viewReport')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/api/report/${shareToken}/pdf`} download>
                        <Download className="size-4" />
                        {t('downloadPdf')}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  {t('deleteSubmit')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        conversationId={conversation.id}
        hasReport={conversation.hasReport}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleLeave}
      />
    </>
  )
}
