import type { BookingStatus, MeetingTypeSlug } from '@/lib/constants/booking'

export interface MeetingTypeRow {
  id: string
  slug: MeetingTypeSlug
  duration_minutes: number
  is_active: boolean
  created_at: string
}

export interface WeeklyScheduleEntry {
  day: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start: string // "HH:MM"
  end: string // "HH:MM"
}

export interface AvailabilityConfigRow {
  id: string
  timezone: string
  buffer_minutes: number
  weekly_schedule: WeeklyScheduleEntry[]
  blocked_dates: string[] // ISO date strings
  max_advance_days: number
  min_notice_hours: number
  updated_at: string
}

export interface BookingRow {
  id: string
  meeting_type_id: string
  conversation_id: string | null
  booker_name: string
  booker_email: string
  booker_message: string | null
  starts_at: string
  ends_at: string
  timezone: string
  status: BookingStatus
  google_event_id: string | null
  briefing: string | null
  briefing_generated_at: string | null
  confirmation_sent_at: string | null
  reminder_sent_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

/** Booking with joined meeting type info */
export interface BookingWithMeetingType extends BookingRow {
  meeting_type: Pick<MeetingTypeRow, 'slug' | 'duration_minutes'>
}

/** Result from the create_booking() RPC */
export interface CreateBookingResult {
  booking_id: string | null
  was_created: boolean
}

/** SSOT error codes for booking server actions */
export const BOOKING_ERROR = {
  VALIDATION: 'booking_validation',
  RATE_LIMITED: 'booking_rate_limited',
  BOOKING_FAILED: 'booking_failed',
  SLOT_UNAVAILABLE: 'slot_unavailable',
  BOOKING_NOT_FOUND: 'booking_not_found',
  CANCEL_FAILED: 'cancel_failed',
  UNAUTHORIZED: 'booking_unauthorized',
  FORBIDDEN: 'booking_forbidden',
  SAVE_FAILED: 'booking_save_failed',
} as const

export type BookingErrorCode =
  (typeof BOOKING_ERROR)[keyof typeof BOOKING_ERROR]
