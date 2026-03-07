import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { MeetingsList } from '@/components/admin/meetings-list'
import { Link } from '@/i18n/routing'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations('adminDashboard')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="terminal-text-glow text-2xl font-bold text-primary">
          {t('title')}
        </h1>
        <Link
          href="/admin/availability"
          className="text-sm text-primary underline hover:text-accent"
        >
          {t('availabilityLink')}
        </Link>
      </div>
      <MeetingsList />
    </div>
  )
}
