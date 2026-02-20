'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import { BRAND_NAME } from '@/lib/constants/chat'
import type { PersonaId } from '@/types/chat'

const PERSONA_NAME_KEYS: Record<
  PersonaId,
  'personaName.doctor' | 'personaName.critic' | 'personaName.guide'
> = {
  doctor: 'personaName.doctor',
  critic: 'personaName.critic',
  guide: 'personaName.guide',
}

function getQuotaBadgeColor(remaining: number): string {
  if (remaining === 0) return 'border-destructive/30 text-destructive'
  if (remaining === 1) return 'border-warning/30 text-warning'
  return 'border-border text-muted-foreground'
}

interface ChatPageHeaderProps {
  persona: PersonaId | null
  onReset: () => void
  hasMessages: boolean
  remaining: number
  limit: number
  isLoading: boolean
}

export function ChatPageHeader({
  persona,
  onReset,
  hasMessages,
  remaining,
  limit,
  isLoading,
}: ChatPageHeaderProps) {
  const t = useTranslations('chat')

  function handleNewConversation() {
    if (hasMessages && !window.confirm(t('header.backConfirm'))) return
    onReset()
  }

  const Illustration = persona ? PERSONA_ILLUSTRATIONS[persona] : null

  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-wider text-primary transition-colors hover:text-primary/80"
        >
          {BRAND_NAME}
        </Link>

        {persona && Illustration ? (
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Illustration className="size-6 text-primary" />
            <span className="hidden font-mono text-sm text-primary/80 sm:inline">
              {t(`header.${PERSONA_NAME_KEYS[persona]}`)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {persona ? (
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
        ) : null}
        {!isLoading && (
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-xs ${getQuotaBadgeColor(remaining)}`}
          >
            {t('quota.badge', { remaining, limit })}
          </span>
        )}
        <LocaleSwitcher />
      </div>
    </header>
  )
}
