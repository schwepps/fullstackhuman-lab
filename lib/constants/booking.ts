// IMPORTANT: MEETING_TYPES slugs must match CHECK constraint in
// supabase/migrations/20260307000000_booking_tables.sql
export const MEETING_TYPES = ['intro', 'deep-dive'] as const
export type MeetingTypeSlug = (typeof MEETING_TYPES)[number]

// IMPORTANT: BOOKING_STATUSES must match CHECK constraint in
// supabase/migrations/20260307000000_booking_tables.sql
export const BOOKING_STATUSES = [
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const GOOGLE_TOKEN_ROW_ID = '00000000-0000-0000-0000-000000000001'

export const BOOKING_DEFAULTS = {
  bufferMinutes: 15,
  maxAdvanceDays: 60,
  minNoticeHours: 24,
  timezone: 'Europe/Paris',
} as const
