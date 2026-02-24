'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationCard } from '@/components/chat/conversation-card'
import { DeleteConversationDialog } from '@/components/chat/delete-conversation-dialog'
import type { ConversationSummary } from '@/types/conversation'

interface RecentConversationsProps {
  conversations: ConversationSummary[]
  isLoading: boolean
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
      ))}
    </div>
  )
}

export function RecentConversations({
  conversations: initialConversations,
  isLoading,
}: RecentConversationsProps) {
  const t = useTranslations('conversations')
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    hasReport: boolean
  } | null>(null)

  // Sync local state when parent re-renders with new data (async fetch)
  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  const handleDeleteRequest = useCallback((id: string, hasReport: boolean) => {
    setDeleteTarget({ id, hasReport })
  }, [])

  const handleDeleted = useCallback(() => {
    if (deleteTarget) {
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
    router.refresh()
  }, [deleteTarget, router])

  if (!isLoading && conversations.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="w-full max-w-3xl px-4 pb-12"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('recentTitle')}
        </h2>
        {conversations.length > 0 && (
          <Link
            href="/conversations"
            className="font-mono text-xs text-primary/70 transition-colors hover:text-primary"
          >
            {t('viewAll')} &rarr;
          </Link>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteConversationDialog
          conversationId={deleteTarget.id}
          hasReport={deleteTarget.hasReport}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          onDeleted={handleDeleted}
        />
      )}
    </motion.div>
  )
}
