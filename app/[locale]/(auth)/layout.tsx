import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { BrandLink } from '@/components/layout/brand-link'

export default async function AuthLayout({
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
    <div className="flex min-h-svh flex-col">
      {/* Minimal header: no UserMenu (auth pages are for unauthenticated users),
          transparent border to keep visual weight low on the centered form layout */}
      <header className="flex h-14 items-center justify-between border-b border-transparent px-4 sm:px-6">
        <BrandLink />
        <LocaleSwitcher />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <main className="w-full max-w-sm">{children}</main>
      </div>
    </div>
  )
}
