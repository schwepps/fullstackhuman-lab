import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getAvailabilityConfig } from '@/lib/booking/admin-queries'
import { AvailabilityForm } from '@/components/admin/availability-form'
import { BOOKING_DEFAULTS } from '@/lib/constants/booking'
import { Link } from '@/i18n/routing'

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations('adminAvailability')
  const config = await getAvailabilityConfig()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="terminal-text-glow text-2xl font-bold text-primary">
          {t('title')}
        </h1>
        <Link
          href="/admin/dashboard"
          className="text-sm text-primary underline hover:text-accent"
        >
          {t('dashboardLink')}
        </Link>
      </div>
      <AvailabilityForm
        initialTimezone={config?.timezone ?? BOOKING_DEFAULTS.timezone}
        initialBufferMinutes={
          config?.buffer_minutes ?? BOOKING_DEFAULTS.bufferMinutes
        }
        initialMaxAdvanceDays={
          config?.max_advance_days ?? BOOKING_DEFAULTS.maxAdvanceDays
        }
        initialMinNoticeHours={
          config?.min_notice_hours ?? BOOKING_DEFAULTS.minNoticeHours
        }
        initialSchedule={config?.weekly_schedule ?? []}
        initialBlockedDates={config?.blocked_dates ?? []}
      />
    </div>
  )
}
