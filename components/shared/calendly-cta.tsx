'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { CALENDLY_URL } from '@/lib/constants/app'
import type { CalendlyClickProperties } from '@/lib/constants/analytics'

interface CalendlyCtaProps {
  variant: 'banner' | 'inline'
  source: CalendlyClickProperties['source']
  className?: string
}

export function CalendlyCta({ variant, source, className }: CalendlyCtaProps) {
  const t = useTranslations('calendlyCta')
  const { trackCalendlyClick } = useAnalytics()

  const handleClick = useCallback(() => {
    trackCalendlyClick({ source })
  }, [trackCalendlyClick, source])

  if (variant === 'inline') {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className={`touch-manipulation ${className ?? ''}`}
      >
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          <Calendar className="size-3.5" />
          {t('action')}
        </a>
      </Button>
    )
  }

  return (
    <Card
      className={`terminal-border border-primary/30 bg-card/50 ${className ?? ''}`}
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
          className="h-12 w-full touch-manipulation sm:h-10 sm:w-auto"
        >
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
          >
            <Calendar className="size-4" />
            {t('action')}
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
