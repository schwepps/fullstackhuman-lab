'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function NotFound() {
  const t = useTranslations('notFound')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10" />
          <div className="absolute inset-2 rounded-full bg-primary/5" />
          <span className="relative text-5xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-muted-foreground">{t('description')}</p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
