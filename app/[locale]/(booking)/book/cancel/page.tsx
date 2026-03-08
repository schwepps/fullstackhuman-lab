import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { CancelBookingPage } from '@/components/booking/cancel-booking-page'

export default async function BookingCancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ id?: string; email?: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const { id, email } = await searchParams

  if (!id || !email) {
    notFound()
  }

  return <CancelBookingPage bookingId={id} email={email} />
}
