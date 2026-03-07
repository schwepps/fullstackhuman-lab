import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/server'
import { BrandLink } from '@/components/layout/brand-link'

export default async function AdminLayout({
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

  // Auth + admin guard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 sm:px-6">
        <BrandLink />
        <span className="font-mono text-xs text-muted-foreground">admin</span>
      </header>
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
