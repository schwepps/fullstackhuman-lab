import {
  checkAnonymousRateLimit,
  checkAuthenticatedRateLimit,
} from '@/lib/ai/rate-limiter'
import { getOptionalAuth } from '@/lib/auth/helpers'

export async function GET() {
  const auth = await getOptionalAuth()

  if (auth.isAuthenticated) {
    const { allowed: _, ...quota } = await checkAuthenticatedRateLimit(
      auth.user.id
    )
    return Response.json(quota)
  }

  const { allowed: _, ...quota } = await checkAnonymousRateLimit()
  return Response.json(quota)
}
