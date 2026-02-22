'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Card, CardContent } from '@/components/ui/card'
import { PERSONAS } from '@/lib/constants/personas'
import { PERSONA_NAME_KEYS } from '@/lib/constants/personas'
import { ConversationStatusBadge } from '@/components/chat/conversation-status-badge'
import type { ConversationSummary } from '@/types/conversation'

interface ConversationCardProps {
  conversation: ConversationSummary
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(diffMs / 86_400_000)
  if (days < 30) return `${days}d`

  const months = Math.floor(days / 30)
  return `${months}mo`
}

export function ConversationCard({ conversation }: ConversationCardProps) {
  const t = useTranslations('chat')
  const tConv = useTranslations('conversations')

  const persona = PERSONAS[conversation.persona]
  const title = conversation.title ?? tConv('untitled')
  const relativeTime = formatRelativeTime(conversation.updatedAt)

  return (
    <Link href={`/chat/${conversation.id}`}>
      <Card className="cursor-pointer border-primary/10 transition-all touch-manipulation hover:border-primary/30 active:scale-[0.98]">
        <CardContent className="flex items-center gap-3 p-3">
          <span className="text-xl" aria-hidden="true">
            {persona.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {title}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(PERSONA_NAME_KEYS[conversation.persona])}
              <span className="mx-1.5">&middot;</span>
              {relativeTime}
            </p>
          </div>
          <ConversationStatusBadge
            status={conversation.status}
            hasReport={conversation.hasReport}
          />
        </CardContent>
      </Card>
    </Link>
  )
}
