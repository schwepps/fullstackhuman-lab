import { getOptionalAuth } from '@/lib/auth/helpers'
import { AUTH_ERROR } from '@/lib/auth/types'
import { getRecentConversations } from '@/lib/conversations/queries'
import { RECENT_CONVERSATIONS_LIMIT } from '@/lib/constants/conversations'

export async function GET(request: Request) {
  const auth = await getOptionalAuth()
  if (!auth.isAuthenticated) {
    return Response.json({ error: AUTH_ERROR.UNAUTHORIZED }, { status: 401 })
  }

  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam
    ? Math.min(
        Math.max(1, parseInt(limitParam, 10) || RECENT_CONVERSATIONS_LIMIT),
        50
      )
    : RECENT_CONVERSATIONS_LIMIT

  const conversations = await getRecentConversations(limit)
  return Response.json(conversations)
}
