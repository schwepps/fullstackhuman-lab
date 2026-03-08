'use client'

import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingCta } from '@/components/shared/booking-cta'

interface ConversationEndActionsProps {
  onStartNew: () => void
}

export function ConversationEndActions({
  onStartNew,
}: ConversationEndActionsProps) {
  const t = useTranslations('conversations')

  return (
    <div className="border-t border-border bg-muted/50 px-4 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <BookingCta variant="banner" source="chat_end" />
        <Button
          variant="outline"
          className="h-12 w-full touch-manipulation font-mono text-sm sm:h-10"
          onClick={onStartNew}
        >
          <Plus className="size-4" />
          {t('startNew')}
        </Button>
      </div>
    </div>
  )
}
