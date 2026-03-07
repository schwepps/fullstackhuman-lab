'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar } from '@/components/ui/calendar'
import type { MeetingTypeSlug } from '@/lib/constants/booking'

/** Format a Date as YYYY-MM-DD using local time (not UTC). */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface DatePickerProps {
  meetingType: MeetingTypeSlug
  timezone: string
  selectedDate: string | null
  onSelect: (date: string) => void
}

export function DatePicker({
  meetingType,
  timezone,
  selectedDate,
  onSelect,
}: DatePickerProps) {
  const t = useTranslations('booking')
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [month, setMonth] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(true)

  const fetchDates = useCallback(
    async (date: Date) => {
      setIsLoading(true)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      try {
        const res = await fetch(
          `/api/booking/slots?month=${yearMonth}&type=${meetingType}&tz=${encodeURIComponent(timezone)}`
        )
        if (res.ok) {
          const data = await res.json()
          setAvailableDates(new Set(data.dates))
        }
      } finally {
        setIsLoading(false)
      }
    },
    [meetingType, timezone]
  )

  useEffect(() => {
    fetchDates(month)
  }, [fetchDates, month])

  const selected = selectedDate
    ? new Date(selectedDate + 'T12:00:00')
    : undefined

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-foreground">
        {t('selectDate')}
      </h2>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => {
          if (date) {
            onSelect(toLocalDateString(date))
          }
        }}
        onMonthChange={setMonth}
        disabled={(date) => {
          if (isLoading) return true
          return !availableDates.has(toLocalDateString(date))
        }}
        className="terminal-border rounded-md border"
      />
    </div>
  )
}
