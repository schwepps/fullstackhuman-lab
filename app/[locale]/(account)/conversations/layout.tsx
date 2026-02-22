import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getOptionalAuth } from '@/lib/auth/helpers'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { UserMenu } from '@/components/layout/user-menu'
import { BrandLink } from '@/components/layout/brand-link'

export default async function ConversationsLayout({
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

  // Defense in depth: middleware redirects unauthenticated users,
  // but verify server-side in case middleware is bypassed.
  const auth = await getOptionalAuth()
  if (!auth.isAuthenticated) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <BrandLink />
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">{children}</main>
    </div>
  )
}
