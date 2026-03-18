import { getDailyBudget, getTotalAttemptCount } from '@/lib/rate-limiter'
import { AVERAGE_COST_PER_ATTEMPT } from '@/lib/constants'

export async function GET() {
  try {
    const [totalAttempts, todayAttempts] = await Promise.all([
      getTotalAttemptCount(),
      getDailyBudget(),
    ])

    const estimatedCostUsd =
      Math.round(totalAttempts * AVERAGE_COST_PER_ATTEMPT * 100) / 100

    return Response.json(
      { totalAttempts, todayAttempts, estimatedCostUsd },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch {
    return Response.json(
      { totalAttempts: 0, todayAttempts: 0, estimatedCostUsd: 0 },
      { status: 200 }
    )
  }
}
