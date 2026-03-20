import { NextResponse } from 'next/server'
import {
  getConvictionLeaderboard,
  getWinsLeaderboard,
} from '@/lib/record-manager'
import { MEMBERS_BY_ID } from '@/lib/members'

export async function GET() {
  const [convictions, wins] = await Promise.all([
    getConvictionLeaderboard(),
    getWinsLeaderboard(),
  ])

  // Fill in member names
  const enriched = (entries: typeof convictions) =>
    entries.map((e) => ({
      ...e,
      memberName: MEMBERS_BY_ID.get(e.memberId)?.name ?? e.memberId,
    }))

  return NextResponse.json({
    mostConvicted: enriched(convictions),
    bestProsecutors: enriched(wins),
  })
}
