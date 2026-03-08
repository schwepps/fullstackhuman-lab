import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots, getAvailableDates } from '@/lib/booking/slots'
import { MEETING_TYPES } from '@/lib/constants/booking'
import { checkSlotsRateLimit } from '@/lib/booking/rate-limit'

/**
 * GET /api/booking/slots
 * Public endpoint returning available time slots.
 *
 * Query params:
 * - date: ISO date (YYYY-MM-DD) — returns slots for that date
 * - month: YYYY-MM — returns available dates for that month
 * - type: meeting type slug (intro)
 * - tz: timezone string (e.g., Europe/Paris)
 */
export async function GET(request: NextRequest) {
  if (!(await checkSlotsRateLimit())) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 })
  }

  const { searchParams } = request.nextUrl
  const date = searchParams.get('date')
  const month = searchParams.get('month')
  const type = searchParams.get('type')
  const tz = searchParams.get('tz') ?? 'Europe/Paris'

  if (
    !type ||
    !MEETING_TYPES.includes(type as (typeof MEETING_TYPES)[number])
  ) {
    return NextResponse.json({ error: 'Invalid meeting type' }, { status: 400 })
  }

  // Return available dates for a month
  if (month) {
    const match = month.match(/^(\d{4})-(\d{2})$/)
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid month format (YYYY-MM)' },
        { status: 400 }
      )
    }
    const dates = await getAvailableDates(
      Number(match[1]),
      Number(match[2]),
      type,
      tz
    )
    return NextResponse.json({ dates })
  }

  // Return available slots for a date
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
    const slots = await getAvailableSlots(date, type, tz)
    return NextResponse.json({ slots })
  }

  return NextResponse.json(
    { error: 'Provide date or month param' },
    { status: 400 }
  )
}
