import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { CheckCircle } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations('booking.confirmation')

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircle className="size-16 text-primary" />
      </div>
      <h1 className="terminal-text-glow mb-3 text-2xl font-bold text-primary">
        {t('title')}
      </h1>
      <p className="mb-6 text-muted-foreground">{t('description')}</p>
      <p className="mb-8 text-sm text-muted-foreground">{t('emailSent')}</p>
      <Link
        href="/"
        className="text-sm text-primary underline hover:text-accent"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}
