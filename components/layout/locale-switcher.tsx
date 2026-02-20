'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('localeSwitcher')

  const otherLocale = routing.locales.find((l) => l !== locale) ?? locale

  function handleSwitch() {
    router.replace(pathname, { locale: otherLocale })
  }

  return (
    <button
      onClick={handleSwitch}
      className="cursor-pointer font-mono text-xs tracking-widest text-primary/60 transition-colors hover:text-primary"
      aria-label={t('ariaLabel', { locale: LOCALE_LABELS[otherLocale] })}
    >
      <span className="text-primary">{LOCALE_LABELS[locale]}</span>
      <span className="mx-1 text-primary/30">/</span>
      <span>{LOCALE_LABELS[otherLocale]}</span>
    </button>
  )
}
