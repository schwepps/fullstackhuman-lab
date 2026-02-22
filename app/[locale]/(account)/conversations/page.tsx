import { getTranslations, setRequestLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getUserConversations } from '@/lib/conversations/queries'
import { ConversationsLibrary } from '@/components/chat/conversations-library'

export default async function ConversationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const { filter } = await searchParams
  const validFilter =
    filter === 'reports' || filter === 'drafts' ? filter : 'all'

  const { items } = await getUserConversations({ filter: validFilter })
  const t = await getTranslations('conversations')

  return (
    <div className="space-y-6">
      <h1 className="terminal-text-glow text-2xl font-bold text-primary">
        {t('libraryTitle')}
      </h1>
      <ConversationsLibrary
        initialConversations={items}
        initialFilter={validFilter}
      />
    </div>
  )
}
