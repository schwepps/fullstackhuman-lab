import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getOptionalAuth } from '@/lib/auth/helpers'
import { getConversation } from '@/lib/conversations/queries'
import { getShareTokenForConversation } from '@/lib/reports/actions'
import { UUID_REGEX } from '@/lib/constants/validation'
import { ConversationViewClient } from '@/components/chat/conversation-view-client'

interface ConversationViewPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function ConversationViewPage({
  params,
}: ConversationViewPageProps) {
  const { locale, id } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const auth = await getOptionalAuth()
  if (!auth.isAuthenticated) {
    redirect('/auth/login')
  }

  if (!UUID_REGEX.test(id)) {
    redirect('/chat')
  }

  const conversation = await getConversation(id)
  if (!conversation) {
    redirect('/chat')
  }

  const shareToken = conversation.hasReport
    ? await getShareTokenForConversation(conversation.id)
    : null

  // Strip userId — not needed client-side, avoid leaking in RSC payload
  const { userId: _, ...clientConversation } = conversation

  return (
    <ConversationViewClient
      conversation={clientConversation}
      shareToken={shareToken}
    />
  )
}
