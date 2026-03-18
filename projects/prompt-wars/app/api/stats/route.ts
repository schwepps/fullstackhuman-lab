import { AVERAGE_COST_PER_ATTEMPT } from '@/lib/constants'
import { getTotalAttemptCount } from '@/lib/rate-limiter'

export async function GET() {
  try {
    const totalAttempts = await getTotalAttemptCount()

    const estimatedCostUsd =
      Math.round(totalAttempts * AVERAGE_COST_PER_ATTEMPT * 100) / 100

    return Response.json(
      { totalAttempts, estimatedCostUsd },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Stats fetch error:', error)
    return Response.json(
      { error: 'Stats temporarily unavailable' },
      { status: 503 }
    )
  }
}
