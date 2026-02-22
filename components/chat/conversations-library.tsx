'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { ConversationCard } from '@/components/chat/conversation-card'
import type { ConversationSummary } from '@/types/conversation'
import type { ConversationFilter } from '@/lib/conversations/queries'

interface ConversationsLibraryProps {
  initialConversations: ConversationSummary[]
  initialFilter: ConversationFilter
}

const FILTER_LABEL_KEYS = {
  all: 'filterAll',
  reports: 'filterReports',
  drafts: 'filterDrafts',
} as const

const FILTER_ORDER: ConversationFilter[] = ['all', 'reports', 'drafts']

export function ConversationsLibrary({
  initialConversations,
  initialFilter,
}: ConversationsLibraryProps) {
  const t = useTranslations('conversations')
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleFilterChange(filter: ConversationFilter) {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    const query = params.toString()
    router.push(query ? `?${query}` : '/conversations')
  }

  return (
    <>
      <div className="flex gap-2">
        {FILTER_ORDER.map((filter) => (
          <Button
            key={filter}
            variant={initialFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(filter)}
            className="font-mono text-xs"
          >
            {t(FILTER_LABEL_KEYS[filter])}
          </Button>
        ))}
      </div>

      {initialConversations.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/chat">{t('startNew')}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {initialConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>
      )}
    </>
  )
}
