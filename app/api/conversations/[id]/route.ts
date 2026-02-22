import { getOptionalAuth } from '@/lib/auth/helpers'
import { AUTH_ERROR } from '@/lib/auth/types'
import { getConversation } from '@/lib/conversations/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getOptionalAuth()
  if (!auth.isAuthenticated) {
    return Response.json({ error: AUTH_ERROR.UNAUTHORIZED }, { status: 401 })
  }

  const { id } = await params
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  const conversation = await getConversation(id)

  if (!conversation) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  return Response.json(conversation)
}
