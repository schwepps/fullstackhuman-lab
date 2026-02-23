'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { UserMenu } from '@/components/layout/user-menu'
import { BrandLink } from '@/components/layout/brand-link'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import { PERSONA_NAME_KEYS } from '@/lib/constants/personas'
import type { PersonaId } from '@/types/chat'
import type { QuotaPeriod } from '@/types/user'

function getQuotaBadgeColor(remaining: number | null): string {
  if (remaining === null) return 'border-border text-muted-foreground'
  if (remaining === 0) return 'border-destructive/30 text-destructive'
  if (remaining === 1) return 'border-warning/30 text-warning'
  return 'border-border text-muted-foreground'
}

function getQuotaTitle(
  isUnlimited: boolean,
  period: QuotaPeriod,
  remaining: number | null,
  limit: number | null,
  t: ReturnType<typeof useTranslations>
): string {
  if (isUnlimited) return t('quota.remainingUnlimited')
  const values = { remaining: remaining ?? 0, limit: limit ?? 0 }
  if (period === 'month') return t('quota.remainingMonth', values)
  return t('quota.remainingDay', values)
}

interface ChatPageHeaderProps {
  persona: PersonaId | null
  onReset: () => void
  hasMessages: boolean
  remaining: number | null
  limit: number | null
  period: QuotaPeriod
  isLoading: boolean
  isReadOnly?: boolean
  actions?: React.ReactNode
}

export function ChatPageHeader({
  persona,
  onReset,
  hasMessages,
  remaining,
  limit,
  period,
  isLoading,
  isReadOnly = false,
  actions,
}: ChatPageHeaderProps) {
  const t = useTranslations('chat')

  function handleNewConversation() {
    if (hasMessages && !isReadOnly && !window.confirm(t('header.backConfirm')))
      return
    onReset()
  }

  const Illustration = persona ? PERSONA_ILLUSTRATIONS[persona] : null
  const isUnlimited = limit === null

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <BrandLink />

        {persona && Illustration ? (
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Illustration className="size-6 text-primary" />
            <span className="hidden font-mono text-sm text-primary/80 sm:inline">
              {t(PERSONA_NAME_KEYS[persona])}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {persona ? (
          isReadOnly ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="cursor-pointer gap-1 touch-manipulation font-mono text-xs"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">
                {t('header.newConversation')}
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="cursor-pointer gap-1 touch-manipulation font-mono text-xs"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">
                {t('header.newConversation')}
              </span>
            </Button>
          )
        ) : null}
        {actions}
        {!isLoading && (
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-xs ${isUnlimited ? 'border-border text-muted-foreground' : getQuotaBadgeColor(remaining)}`}
            title={getQuotaTitle(isUnlimited, period, remaining, limit, t)}
          >
            {isUnlimited
              ? t('quota.badgeUnlimited')
              : t('quota.badge', {
                  remaining: remaining ?? 0,
                  limit: limit ?? 0,
                })}
          </span>
        )}
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
