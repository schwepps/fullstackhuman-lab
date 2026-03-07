import { z } from 'zod/v4'
import { MEETING_TYPES } from '@/lib/constants/booking'

export const bookingFormSchema = z.object({
  meetingType: z.enum(MEETING_TYPES),
  date: z.iso.date(),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
  name: z.string().trim().min(1),
  email: z.email().trim(),
  message: z.string().trim().optional(),
  conversationId: z.uuid().optional(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

export const cancelBookingSchema = z.object({
  bookingId: z.uuid(),
  email: z.email().trim(),
})

export type CancelBookingData = z.infer<typeof cancelBookingSchema>

export const weeklyScheduleEntrySchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

export const availabilityConfigSchema = z.object({
  timezone: z.string().trim().min(1),
  bufferMinutes: z.number().int().min(0),
  weeklySchedule: z.array(weeklyScheduleEntrySchema),
  blockedDates: z.array(z.iso.date()),
  maxAdvanceDays: z.number().int().min(1),
  minNoticeHours: z.number().int().min(0),
})

export type AvailabilityConfigFormData = z.infer<
  typeof availabilityConfigSchema
>
