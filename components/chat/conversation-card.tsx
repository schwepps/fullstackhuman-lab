'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Download, ExternalLink, MoreVertical, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PERSONA_NAME_KEYS } from '@/lib/constants/personas'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
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

  const Illustration = PERSONA_ILLUSTRATIONS[conversation.persona]
  const title = conversation.title ?? tConv('untitled')
  const { key, count } = getRelativeTimeKey(conversation.updatedAt)
  const relativeTime = count !== undefined ? tTime(key, { count }) : tTime(key)

  return (
    <Link href={`/chat/${conversation.id}`}>
      <Card className="cursor-pointer border-primary/10 transition-all touch-manipulation hover:border-primary/30 active:scale-[0.98]">
        <CardContent className="flex items-center gap-3 p-3">
          <Illustration
            className="size-10 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {title}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{t(PERSONA_NAME_KEYS[conversation.persona])}</span>
              <span>&middot;</span>
              <span>{relativeTime}</span>
              <span>&middot;</span>
              <ConversationStatusBadge
                status={conversation.status}
                hasReport={conversation.hasReport}
              />
            </p>
          </div>
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
                {conversation.shareToken && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/report/${conversation.shareToken}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="size-4" />
                        {tConv('viewReport')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      {/* Raw <a>: API routes are not locale-prefixed */}
                      <a
                        href={`/api/report/${conversation.shareToken}/pdf`}
                        download
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="size-4" />
                        {tConv('downloadPdf')}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteRequest(conversation.id, conversation.hasReport)
                  }}
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
