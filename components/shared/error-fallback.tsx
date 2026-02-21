'use client'

import { useTranslations } from 'next-intl'
import { TriangleAlert } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'

type ErrorBoundaryMessageKey =
  | 'title'
  | 'description'
  | 'chatTitle'
  | 'chatDescription'

interface ErrorFallbackProps {
  reset: () => void
  titleKey?: ErrorBoundaryMessageKey
  descriptionKey?: ErrorBoundaryMessageKey
  showHomeLink?: boolean
}

export function ErrorFallback({
  reset,
  titleKey = 'title',
  descriptionKey = 'description',
  showHomeLink = true,
}: ErrorFallbackProps) {
  const t = useTranslations('errorBoundary')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/10" />
          <div className="absolute inset-2 rounded-full bg-destructive/5" />
          <TriangleAlert className="relative size-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t(titleKey)}
        </h1>
        <p className="mt-4 text-muted-foreground">{t(descriptionKey)}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="h-12 w-full touch-manipulation sm:h-10 sm:w-auto"
          >
            {t('retry')}
          </Button>
          {showHomeLink && (
            <Button
              variant="outline"
              asChild
              className="h-12 w-full touch-manipulation sm:h-10 sm:w-auto"
            >
              <Link href="/">{t('backHome')}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
