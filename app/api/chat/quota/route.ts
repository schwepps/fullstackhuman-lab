import { checkRateLimit } from '@/lib/ai/rate-limiter'
import { MAX_CONVERSATIONS_PER_DAY } from '@/lib/constants/chat'

export async function GET() {
  const { remaining } = await checkRateLimit()
  return Response.json({ remaining, limit: MAX_CONVERSATIONS_PER_DAY })
}
