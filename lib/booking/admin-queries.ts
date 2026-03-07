import { createServiceClient } from '@/lib/supabase/service'
import type { AvailabilityConfigRow, BookingWithMeetingType } from './types'

export async function getUpcomingBookings(): Promise<BookingWithMeetingType[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('bookings')
    .select('*, meeting_type:meeting_types(slug, duration_minutes)')
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  return (data ?? []) as BookingWithMeetingType[]
}

export async function getPastBookings(): Promise<BookingWithMeetingType[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('bookings')
    .select('*, meeting_type:meeting_types(slug, duration_minutes)')
    .or('status.neq.confirmed,starts_at.lt.' + new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(50)

  return (data ?? []) as BookingWithMeetingType[]
}

export async function getBookingWithContext(bookingId: string) {
  const supabase = createServiceClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, meeting_type:meeting_types(slug, duration_minutes)')
    .eq('id', bookingId)
    .single()

  if (!booking) return null

  let conversationMessages: unknown[] = []
  if (booking.conversation_id) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', booking.conversation_id)
      .single()

    if (conversation) {
      conversationMessages = conversation.messages as unknown[]
    }
  }

  return {
    booking: booking as BookingWithMeetingType,
    conversationMessages,
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = createServiceClient()
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'cancelled') {
    update.cancelled_at = new Date().toISOString()
  }
  const { error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', bookingId)

  return !error
}

export async function updateBookingBriefing(
  bookingId: string,
  briefing: string
) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('bookings')
    .update({
      briefing,
      briefing_generated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  return !error
}

export async function getAvailabilityConfig(): Promise<AvailabilityConfigRow | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('availability_config')
    .select('*')
    .single()

  return (data as AvailabilityConfigRow) ?? null
}
