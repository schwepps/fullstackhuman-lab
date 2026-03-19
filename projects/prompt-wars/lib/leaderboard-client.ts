export class LeaderboardError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
  }
}

const USER_ERROR_MAP: Record<number, string> = {
  403: 'No verified wins found. Play a level first.',
  429: 'Too many submissions. Try again later.',
}

export async function postLeaderboard(
  sessionId: string,
  displayName: string
): Promise<{ totalScore: number }> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const res = await fetch(`${basePath}/api/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, displayName }),
  })
  if (!res.ok) {
    throw new LeaderboardError(
      USER_ERROR_MAP[res.status] ?? 'Something went wrong. Try again.',
      res.status
    )
  }
  return (await res.json()) as { totalScore: number }
}
