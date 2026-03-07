import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { BrandLink } from '@/components/layout/brand-link'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 sm:px-6">
        <BrandLink />
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
