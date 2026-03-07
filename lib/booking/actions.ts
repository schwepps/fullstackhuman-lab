'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { bookingFormSchema, cancelBookingSchema } from './schemas'
import { createCalendarEvent, deleteCalendarEvent } from './google-calendar'
import { sendEmail } from '@/lib/email/send'
import {
  bookingConfirmationSubject,
  bookingConfirmationHtml,
} from '@/lib/email/templates/booking-confirmation'
import {
  bookingNotificationSubject,
  bookingNotificationHtml,
} from '@/lib/email/templates/booking-notification'
import {
  bookingCancellationBookerSubject,
  bookingCancellationAdminSubject,
  bookingCancellationHtml,
} from '@/lib/email/templates/booking-cancellation'
import { FOUNDER_NAME } from '@/lib/constants/brand'
import { checkBookingRateLimit } from './rate-limit'
import { BOOKING_ERROR } from './types'
import type { ActionResult } from '@/types/action'
import type { CreateBookingResult } from './types'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

function getMeetingTypeDisplay(
  slug: string | undefined,
  durationMinutes: number
): string {
  const label = slug === 'intro' ? 'Intro' : 'Deep Dive'
  return `${label} (${durationMinutes} min)`
}

interface CreateBookingInput {
  meetingType: string
  date: string
  timeSlot: string
  timezone: string
  name: string
  email: string
  message?: string
  conversationId?: string
  locale?: string
}

export async function createBooking(
  input: CreateBookingInput
): Promise<ActionResult<{ bookingId: string }>> {
  if (!(await checkBookingRateLimit())) {
    return { success: false, error: BOOKING_ERROR.RATE_LIMITED }
  }

  const parsed = bookingFormSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: BOOKING_ERROR.VALIDATION }
  }

  const {
    meetingType,
    date,
    timeSlot,
    timezone,
    name,
    email,
    message,
    conversationId,
  } = parsed.data

  const locale = input.locale === 'fr' ? 'fr' : 'en'
  const supabase = await createClient()

  // Verify conversation ownership if conversationId is provided
  if (conversationId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      // Anonymous users cannot link conversations
      return { success: false, error: BOOKING_ERROR.VALIDATION }
    }
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()
    if (!conv) {
      return { success: false, error: BOOKING_ERROR.VALIDATION }
    }
  }

  // Call the atomic create_booking() RPC
  const { data, error } = await supabase.rpc('create_booking', {
    p_meeting_type_slug: meetingType,
    p_starts_at: `${date}T${timeSlot}:00`,
    p_timezone: timezone,
    p_booker_name: name,
    p_booker_email: email,
    p_booker_message: message ?? null,
    p_conversation_id: conversationId ?? null,
  })

  if (error) {
    return { success: false, error: BOOKING_ERROR.BOOKING_FAILED }
  }

  const result = data as CreateBookingResult
  if (!result.was_created || !result.booking_id) {
    return { success: false, error: BOOKING_ERROR.SLOT_UNAVAILABLE }
  }

  const bookingId = result.booking_id

  // Fetch the created booking for email details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, meeting_type:meeting_types(slug, duration_minutes)')
    .eq('id', bookingId)
    .single()

  if (booking) {
    const durationMinutes = booking.meeting_type?.duration_minutes ?? 30
    const meetingTypeDisplay = getMeetingTypeDisplay(
      booking.meeting_type?.slug,
      durationMinutes
    )

    // Create Google Calendar event (fire-and-forget)
    const eventId = await createCalendarEvent({
      summary: `${FOUNDER_NAME} <> ${name} (${meetingTypeDisplay})`,
      description: message
        ? `Message: ${message}\n\nBooked via FullStackHuman`
        : 'Booked via FullStackHuman',
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      attendeeEmail: email,
      timezone,
    })

    if (eventId) {
      await supabase
        .from('bookings')
        .update({ google_event_id: eventId })
        .eq('id', bookingId)
    }

    // Send confirmation email to booker (fire-and-forget)
    void sendEmail({
      to: email,
      subject: bookingConfirmationSubject(locale),
      html: bookingConfirmationHtml({
        bookerName: name,
        meetingType: meetingTypeDisplay,
        date,
        time: timeSlot,
        timezone,
        durationMinutes,
        bookingId,
        bookerEmail: email,
        locale,
      }),
    })

    // Send notification to admin (fire-and-forget)
    if (ADMIN_EMAIL) {
      const notifData = {
        bookerName: name,
        bookerEmail: email,
        bookerMessage: message ?? null,
        meetingType: meetingTypeDisplay,
        date,
        time: timeSlot,
        timezone,
        durationMinutes,
        hasConversationContext: !!conversationId,
        bookingId,
      }
      void sendEmail({
        to: ADMIN_EMAIL,
        subject: bookingNotificationSubject(notifData),
        html: bookingNotificationHtml(notifData),
      })
    }
  }

  return { success: true, bookingId }
}

interface CancelBookingInput {
  bookingId: string
  email: string
  locale?: string
}

export async function cancelBooking(
  input: CancelBookingInput
): Promise<ActionResult> {
  if (!(await checkBookingRateLimit())) {
    return { success: false, error: BOOKING_ERROR.RATE_LIMITED }
  }

  const parsed = cancelBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: BOOKING_ERROR.VALIDATION }
  }

  const { bookingId, email } = parsed.data
  const locale = input.locale === 'fr' ? 'fr' : 'en'
  const serviceClient = createServiceClient()

  // Verify booking exists and email matches
  const { data: booking } = await serviceClient
    .from('bookings')
    .select('*, meeting_type:meeting_types(slug, duration_minutes)')
    .eq('id', bookingId)
    .eq('booker_email', email)
    .eq('status', 'confirmed')
    .single()

  if (!booking) {
    return { success: false, error: BOOKING_ERROR.BOOKING_NOT_FOUND }
  }

  // Update status to cancelled (service client needed — no UPDATE grants on bookings)
  const { error } = await serviceClient
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelled by booker',
    })
    .eq('id', bookingId)

  if (error) {
    return { success: false, error: BOOKING_ERROR.CANCEL_FAILED }
  }

  // Delete Google Calendar event
  if (booking.google_event_id) {
    void deleteCalendarEvent(booking.google_event_id)
  }

  const durationMinutes = booking.meeting_type?.duration_minutes ?? 30
  const meetingTypeDisplay = getMeetingTypeDisplay(
    booking.meeting_type?.slug,
    durationMinutes
  )
  const dateStr = new Date(booking.starts_at).toISOString().split('T')[0]
  const timeStr = new Date(booking.starts_at)
    .toISOString()
    .split('T')[1]
    .slice(0, 5)

  const cancellationData = {
    recipientName: booking.booker_name,
    meetingType: meetingTypeDisplay,
    date: dateStr,
    time: timeStr,
    timezone: booking.timezone,
    cancellationReason: 'Cancelled by booker',
    locale,
  }

  // Send cancellation email to booker
  void sendEmail({
    to: email,
    subject: bookingCancellationBookerSubject(locale),
    html: bookingCancellationHtml(cancellationData),
  })

  // Send cancellation notification to admin
  if (ADMIN_EMAIL) {
    void sendEmail({
      to: ADMIN_EMAIL,
      subject: bookingCancellationAdminSubject(booking.booker_name, locale),
      html: bookingCancellationHtml({
        ...cancellationData,
        recipientName: FOUNDER_NAME,
      }),
    })
  }

  return { success: true }
}
