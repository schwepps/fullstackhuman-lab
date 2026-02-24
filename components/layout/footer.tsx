'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useCookieConsentContext } from '@/components/layout/cookie-consent-provider'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { LINKEDIN_URL, TELEGRAM_BOT_URL } from '@/lib/constants/app'
import { TelegramIcon } from '@/components/shared/telegram-link'
import { BRAND_NAME_DISPLAY } from '@/lib/constants/brand'

const linkClass =
  'py-1 font-mono text-xs text-foreground/40 transition-colors hover:text-primary'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function Footer() {
  const t = useTranslations('footer')
  const { openBanner } = useCookieConsentContext()
  const { trackTelegramClick } = useAnalytics()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
        {/* Brand tagline */}
        <p className="font-mono text-sm text-foreground/40">
          {t('tagline', { brand: BRAND_NAME_DISPLAY, year })}
        </p>

        {/* Attribution + LinkedIn */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-foreground/30">
            {t('builtBy')}
          </span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/30 transition-colors hover:text-primary"
            aria-label={t('linkedinAriaLabel')}
          >
            <LinkedInIcon className="h-5 w-5" />
          </a>
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/30 transition-colors hover:text-primary"
            aria-label={t('telegramAriaLabel')}
            onClick={() => trackTelegramClick({ source: 'footer' })}
          >
            <TelegramIcon className="h-5 w-5" />
          </a>
        </div>

        {/* Legal links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
      </div>
    </footer>
  )
}
