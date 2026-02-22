'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationCard } from '@/components/chat/conversation-card'
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
  conversations,
  isLoading,
}: RecentConversationsProps) {
  const t = useTranslations('conversations')

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
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
