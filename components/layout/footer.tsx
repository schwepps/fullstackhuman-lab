'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useCookieConsentContext } from '@/components/layout/cookie-consent-provider'

const linkClass =
  'py-1 font-mono text-xs text-foreground/40 transition-colors hover:text-primary'

export function Footer() {
  const t = useTranslations('footer')
  const { openBanner } = useCookieConsentContext()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
          <Link href="/privacy" className={linkClass}>
            {t('privacy')}
          </Link>
          <Link href="/terms" className={linkClass}>
            {t('terms')}
          </Link>
          <Link href="/legal" className={linkClass}>
            {t('legal')}
          </Link>
          <button type="button" onClick={openBanner} className={linkClass}>
            {t('cookieSettings')}
          </button>
        </nav>
        <p className="font-mono text-xs text-foreground/30">
          {t('copyright', { year })}
        </p>
      </div>
    </footer>
  )
}
