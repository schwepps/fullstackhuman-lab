import { NextRequest, NextResponse } from 'next/server'
import { createBooking } from '@/lib/booking/actions'

/**
 * POST /api/booking
 * Public endpoint to create a booking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createBooking(body)

    if (!result.success) {
      const status = result.error === 'SLOT_UNAVAILABLE' ? 409 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ bookingId: result.bookingId }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
