'use client'

import { useTranslations } from 'next-intl'
import { MessageSquare } from 'lucide-react'

export function BookingContextBanner() {
  const t = useTranslations('booking')

  return (
    <div className="mb-6 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
      <MessageSquare className="size-4 shrink-0" />
      <span>{t('contextBanner')}</span>
    </div>
  )
}
