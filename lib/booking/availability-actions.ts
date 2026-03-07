'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { availabilityConfigSchema } from './schemas'
import type { ActionResult } from '@/types/action'

export async function saveAvailabilityConfig(
  input: unknown
): Promise<ActionResult> {
  // Verify admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'UNAUTHORIZED' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { success: false, error: 'FORBIDDEN' }
  }

  const parsed = availabilityConfigSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'VALIDATION_ERROR' }
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
    .eq(
      'id',
      (await serviceClient.from('availability_config').select('id').single())
        .data?.id
    )

  if (error) {
    return { success: false, error: 'SAVE_FAILED' }
  }

  return { success: true }
}
