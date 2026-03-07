'use client'

import { useTranslations } from 'next-intl'
import { Clock, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { MeetingTypeSlug } from '@/lib/constants/booking'

interface MeetingTypeSelectorProps {
  onSelect: (type: MeetingTypeSlug) => void
}

export function MeetingTypeSelector({ onSelect }: MeetingTypeSelectorProps) {
  const t = useTranslations('booking.meetingTypes')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card
        className="cursor-pointer border-primary/20 transition-all hover:border-primary/60 active:scale-[0.98] touch-manipulation"
        onClick={() => onSelect('intro')}
      >
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Zap className="size-8 text-primary" />
          <div>
            <p className="font-semibold text-foreground">{t('intro.title')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('intro.description')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary">
            <Clock className="size-3.5" />
            <span>{t('intro.duration')}</span>
          </div>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer border-primary/20 transition-all hover:border-primary/60 active:scale-[0.98] touch-manipulation"
        onClick={() => onSelect('deep-dive')}
      >
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Zap className="size-8 text-primary" />
          <div>
            <p className="font-semibold text-foreground">
              {t('deepDive.title')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('deepDive.description')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary">
            <Clock className="size-3.5" />
            <span>{t('deepDive.duration')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
