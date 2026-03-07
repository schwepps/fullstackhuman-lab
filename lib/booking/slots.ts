import { createClient } from '@/lib/supabase/server'
import { checkCalendarAvailability } from '@/lib/booking/google-calendar'
import { BOOKING_DEFAULTS } from '@/lib/constants/booking'
import type { AvailabilityConfigRow, WeeklyScheduleEntry } from './types'

/**
 * Get available time slots for a given date and meeting type.
 */
export async function getAvailableSlots(
  date: string,
  meetingTypeSlug: string,
  _timezone: string
): Promise<string[]> {
  const supabase = await createClient()

  // Fetch availability config
  const { data: config } = await supabase
    .from('availability_config')
    .select('*')
    .single()

  if (!config) return []
  const avail = config as AvailabilityConfigRow

  // Check if date is blocked
  if (avail.blocked_dates.includes(date)) return []

  // Check advance days limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date + 'T00:00:00')
  const daysDiff = Math.floor(
    (targetDate.getTime() - today.getTime()) / 86_400_000
  )
  if (daysDiff < 0 || daysDiff > avail.max_advance_days) return []

  // Get meeting type duration
  const { data: meetingType } = await supabase
    .from('meeting_types')
    .select('duration_minutes')
    .eq('slug', meetingTypeSlug)
    .eq('is_active', true)
    .single()

  if (!meetingType) return []
  const duration = meetingType.duration_minutes

  // Get day-of-week schedule (0 = Sunday) — use getDay() not getUTCDay()
  // because targetDate is constructed in local time (no Z suffix)
  const dayOfWeek = targetDate.getDay()
  const schedule = (avail.weekly_schedule as WeeklyScheduleEntry[]).filter(
    (entry) => entry.day === dayOfWeek
  )
  if (schedule.length === 0) return []

  // Generate candidate slots from schedule windows
  const candidates: string[] = []
  for (const window of schedule) {
    const [startH, startM] = window.start.split(':').map(Number)
    const [endH, endM] = window.end.split(':').map(Number)
    const windowStart = startH * 60 + startM
    const windowEnd = endH * 60 + endM

    for (let mins = windowStart; mins + duration <= windowEnd; mins += 30) {
      const h = String(Math.floor(mins / 60)).padStart(2, '0')
      const m = String(mins % 60).padStart(2, '0')
      candidates.push(`${h}:${m}`)
    }
  }

  if (candidates.length === 0) return []

  // Fetch existing confirmed bookings for this date
  const dayStart = `${date}T00:00:00`
  const dayEnd = `${date}T23:59:59`
  const { data: bookings } = await supabase
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('status', 'confirmed')
    .gte('starts_at', dayStart)
    .lte('starts_at', dayEnd)

  const buffer = avail.buffer_minutes

  // Filter out overlapping slots
  const available: string[] = []
  for (const slot of candidates) {
    const slotStart = new Date(`${date}T${slot}:00`)
    const slotEnd = new Date(slotStart.getTime() + duration * 60_000)

    // Check min notice hours
    const now = new Date()
    const hoursUntilSlot = (slotStart.getTime() - now.getTime()) / 3_600_000
    if (hoursUntilSlot < avail.min_notice_hours) continue

    // Check against existing bookings (with buffer)
    const hasConflict = (bookings ?? []).some((b) => {
      const bStart = new Date(b.starts_at).getTime() - buffer * 60_000
      const bEnd = new Date(b.ends_at).getTime() + buffer * 60_000
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
    })
    if (hasConflict) continue

    // Check Google Calendar availability (defense in depth)
    const gcalFree = await checkCalendarAvailability(
      slotStart.toISOString(),
      slotEnd.toISOString()
    )
    if (!gcalFree) continue

    available.push(slot)
  }

  return available
}

/**
 * Get dates with available slots for a given month.
 */
export async function getAvailableDates(
  year: number,
  month: number,
  _meetingTypeSlug: string,
  _timezone: string
): Promise<string[]> {
  const supabase = await createClient()

  // Fetch availability config
  const { data: config } = await supabase
    .from('availability_config')
    .select('weekly_schedule, blocked_dates, max_advance_days')
    .single()

  if (!config) return []

  const schedule = config.weekly_schedule as WeeklyScheduleEntry[]
  const blockedDates = config.blocked_dates as string[]
  const maxAdvanceDays =
    config.max_advance_days ?? BOOKING_DEFAULTS.maxAdvanceDays

  const activeDays = new Set(schedule.map((e) => e.day))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dates: string[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day)
    const dateStr = d.toISOString().split('T')[0]
    const daysDiff = Math.floor((d.getTime() - today.getTime()) / 86_400_000)

    if (daysDiff < 0) continue
    if (daysDiff > maxAdvanceDays) continue
    if (!activeDays.has(d.getDay())) continue
    if (blockedDates.includes(dateStr)) continue

    dates.push(dateStr)
  }

  return dates
}
