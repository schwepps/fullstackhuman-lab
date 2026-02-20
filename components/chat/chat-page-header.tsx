'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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

interface ChatPageHeaderProps {
  persona: PersonaId | null
  onReset: () => void
  hasMessages: boolean
}

export function ChatPageHeader({
  persona,
  onReset,
  hasMessages,
}: ChatPageHeaderProps) {
  const t = useTranslations('chat.header')
  const showBack = persona !== null && hasMessages

  function handleBack() {
    if (!window.confirm(t('backConfirm'))) return
    onReset()
  }

  const Illustration = persona ? PERSONA_ILLUSTRATIONS[persona] : null

  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="touch-manipulation"
            aria-label={t('backLabel')}
          >
            <ArrowLeft className="size-5" />
          </Button>
        ) : null}

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
              {t(PERSONA_NAME_KEYS[persona])}
            </span>
          </div>
        ) : null}
      </div>

      <LocaleSwitcher />
    </header>
  )
}
