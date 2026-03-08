'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { BOOK_PATH } from '@/lib/constants/app'
import { cn } from '@/lib/utils'
import type { BookingClickProperties } from '@/lib/constants/analytics'

interface BookingCtaProps {
  variant: 'banner' | 'inline'
  source: BookingClickProperties['source']
  className?: string
  buttonVariant?: 'default' | 'outline'
  conversationId?: string
}

export function BookingCta({
  variant,
  source,
  className,
  buttonVariant,
  conversationId,
}: BookingCtaProps) {
  const t = useTranslations('bookingCta')
  const { trackBookingClick } = useAnalytics()

  const handleClick = useCallback(() => {
    trackBookingClick({ source })
  }, [trackBookingClick, source])

  const href = conversationId
    ? `${BOOK_PATH}?context=${conversationId}`
    : BOOK_PATH

  if (variant === 'inline') {
    return (
      <Button
        asChild
        variant={buttonVariant ?? 'outline'}
        size="sm"
        className={cn('touch-manipulation', className)}
      >
        <Link href={href} onClick={handleClick}>
          <Calendar className="size-3.5" />
          {t('action')}
        </Link>
      </Button>
    )
  }

  return (
    <Card
      className={cn('terminal-border border-primary/30 bg-card/50', className)}
    >
      <CardContent className="flex flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="font-semibold text-primary">{t('title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full border-primary/30 touch-manipulation sm:h-10 sm:w-auto"
        >
          <Link href={href} onClick={handleClick}>
            <Calendar className="size-4" />
            {t('action')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
