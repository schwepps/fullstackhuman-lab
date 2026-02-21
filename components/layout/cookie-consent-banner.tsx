'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'

interface CookieConsentBannerProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
}

export function CookieConsentBanner({
  isOpen,
  onAccept,
  onDecline,
}: CookieConsentBannerProps) {
  const t = useTranslations('cookieConsent')

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-label={t('ariaLabel')}
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-background/95 px-4 py-4 backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            {t('title')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/60">
            {t('description')}{' '}
            <Link
              href="/privacy"
              className="text-primary transition-colors hover:underline"
            >
              {t('privacyLink')}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDecline}
            className="h-11 touch-manipulation font-mono text-xs sm:h-9"
          >
            {t('decline')}
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            className="h-11 touch-manipulation font-mono text-xs sm:h-9"
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
