import { NextRequest, NextResponse } from 'next/server'
import { createBooking } from '@/lib/booking/actions'
import { BOOKING_ERROR } from '@/lib/booking/types'

/**
 * POST /api/booking
 * Public endpoint to create a booking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createBooking(body)

    if (!result.success) {
      if (result.error === BOOKING_ERROR.RATE_LIMITED) {
        return NextResponse.json({ error: result.error }, { status: 429 })
      }
      const status = result.error === BOOKING_ERROR.SLOT_UNAVAILABLE ? 409 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ bookingId: result.bookingId }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
