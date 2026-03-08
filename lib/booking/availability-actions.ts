'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { checkIsAdmin } from '@/lib/auth/check-admin'
import { checkBookingRateLimit } from './rate-limit'
import { availabilityConfigSchema } from './schemas'
import { BOOKING_ERROR } from './types'
import type { ActionResult } from '@/types/action'

export async function saveAvailabilityConfig(
  input: unknown
): Promise<ActionResult> {
  if (!(await checkBookingRateLimit())) {
    return { success: false, error: BOOKING_ERROR.RATE_LIMITED }
  }

  const { isAdmin } = await checkIsAdmin()
  if (!isAdmin) {
    return { success: false, error: BOOKING_ERROR.FORBIDDEN }
  }

  const parsed = availabilityConfigSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: BOOKING_ERROR.VALIDATION }
  }

  const {
    timezone,
    bufferMinutes,
    weeklySchedule,
    blockedDates,
    maxAdvanceDays,
    minNoticeHours,
  } = parsed.data

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('availability_config')
    .update({
      timezone,
      buffer_minutes: bufferMinutes,
      weekly_schedule: weeklySchedule,
      blocked_dates: blockedDates,
      max_advance_days: maxAdvanceDays,
      min_notice_hours: minNoticeHours,
      updated_at: new Date().toISOString(),
    })
    .not('id', 'is', null)

  if (error) {
    return { success: false, error: BOOKING_ERROR.SAVE_FAILED }
  }

  return { success: true }
}
