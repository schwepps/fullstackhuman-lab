'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { MoreVertical, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PERSONAS, PERSONA_NAME_KEYS } from '@/lib/constants/personas'
import { ConversationStatusBadge } from '@/components/chat/conversation-status-badge'
import type { ConversationSummary } from '@/types/conversation'

interface ConversationCardProps {
  conversation: ConversationSummary
  onDeleteRequest?: (id: string, hasReport: boolean) => void
}

type TimeKey = 'justNow' | 'minutes' | 'hours' | 'days' | 'months'

function getRelativeTimeKey(dateString: string): {
  key: TimeKey
  count?: number
} {
  const diffMs = Date.now() - new Date(dateString).getTime()

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return { key: 'justNow' }
  if (minutes < 60) return { key: 'minutes', count: minutes }

  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 24) return { key: 'hours', count: hours }

  const days = Math.floor(diffMs / 86_400_000)
  if (days < 30) return { key: 'days', count: days }

  const months = Math.floor(days / 30)
  return { key: 'months', count: months }
}

export function ConversationCard({
  conversation,
  onDeleteRequest,
}: ConversationCardProps) {
  const t = useTranslations('chat')
  const tConv = useTranslations('conversations')
  const tTime = useTranslations('conversations.time')

  const persona = PERSONAS[conversation.persona]
  const title = conversation.title ?? tConv('untitled')
  const { key, count } = getRelativeTimeKey(conversation.updatedAt)
  const relativeTime = count !== undefined ? tTime(key, { count }) : tTime(key)

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
          {onDeleteRequest && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 touch-manipulation"
                  aria-label={tConv('actions')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    onDeleteRequest(conversation.id, conversation.hasReport)
                  }
                >
                  <Trash2 className="size-4" />
                  {tConv('deleteSubmit')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
