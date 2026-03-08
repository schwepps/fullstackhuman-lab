'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MeetingTypeSlug } from '@/lib/constants/booking'

interface TimeSlotPickerProps {
  date: string
  meetingType: MeetingTypeSlug
  timezone: string
  selectedTime: string | null
  onSelect: (time: string) => void
}

export function TimeSlotPicker({
  date,
  meetingType,
  timezone,
  selectedTime,
  onSelect,
}: TimeSlotPickerProps) {
  const t = useTranslations('booking')
  const [slots, setSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSlots = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/booking/slots?date=${date}&type=${meetingType}&tz=${encodeURIComponent(timezone)}`
      )
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots)
      }
    } finally {
      setIsLoading(false)
    }
  }, [date, meetingType, timezone])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  if (isLoading) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        {t('loadingSlots')}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        {t('noSlots')}
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-3 text-center text-sm font-medium text-foreground">
        {t('selectTime')}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => (
          <Button
            key={slot}
            variant={selectedTime === slot ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-11 touch-manipulation font-mono text-sm',
              selectedTime === slot &&
                'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
            onClick={() => onSelect(slot)}
          >
            {slot}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t('timezone', { tz: timezone })}
      </p>
    </div>
  )
}
