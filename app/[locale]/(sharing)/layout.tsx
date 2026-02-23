import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { BrandLink } from '@/components/layout/brand-link'

export default async function SharingLayout({
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
    <div className="flex min-h-svh flex-col bg-gray-50">
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
        <BrandLink />
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
