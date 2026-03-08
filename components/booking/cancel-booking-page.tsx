'use client'

import { useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { cancelBooking } from '@/lib/booking/actions'
import { Link } from '@/i18n/routing'
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { BOOKING_ERROR } from '@/lib/booking/types'

type CancelState = 'confirm' | 'cancelling' | 'cancelled' | 'error'

interface CancelBookingPageProps {
  bookingId: string
  email: string
}

export function CancelBookingPage({
  bookingId,
  email,
}: CancelBookingPageProps) {
  const t = useTranslations('booking.cancel')
  const locale = useLocale()
  const [state, setState] = useState<CancelState>('confirm')
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const handleCancel = useCallback(async () => {
    setState('cancelling')
    const result = await cancelBooking({ bookingId, email, locale })
    if (result.success) {
      setState('cancelled')
    } else {
      setErrorKey(result.error ?? null)
      setState('error')
    }
  }, [bookingId, email, locale])

  if (state === 'cancelled') {
    return (
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="size-16 text-primary" />
        </div>
        <h1 className="terminal-text-glow mb-3 text-2xl font-bold text-primary">
          {t('successTitle')}
        </h1>
        <p className="mb-8 text-muted-foreground">{t('successDescription')}</p>
        <Link
          href="/"
          className="text-sm text-primary underline hover:text-accent"
        >
          {t('backHome')}
        </Link>
      </div>
    )
  }

  if (state === 'error') {
    const errorMessage =
      errorKey === BOOKING_ERROR.BOOKING_NOT_FOUND
        ? t('errors.notFound')
        : errorKey === BOOKING_ERROR.RATE_LIMITED
          ? t('errors.rateLimited')
          : t('errors.generic')

    return (
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <AlertTriangle className="size-16 text-destructive" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-destructive">
          {t('errorTitle')}
        </h1>
        <p className="mb-8 text-muted-foreground">{errorMessage}</p>
        <Link
          href="/"
          className="text-sm text-primary underline hover:text-accent"
        >
          {t('backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-6 flex justify-center">
        <XCircle className="size-16 text-muted-foreground" />
      </div>
      <h1 className="mb-3 text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mb-8 text-muted-foreground">{t('description')}</p>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleCancel}
          disabled={state === 'cancelling'}
          className="rounded-md bg-destructive px-6 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
        >
          {state === 'cancelling' ? t('cancelling') : t('confirmCancel')}
        </button>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          {t('keepBooking')}
        </Link>
      </div>
    </div>
  )
}
