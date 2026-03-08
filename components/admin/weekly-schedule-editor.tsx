'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WeeklyScheduleEntry } from '@/lib/booking/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface WeeklyScheduleEditorProps {
  label: string
  schedule: WeeklyScheduleEntry[]
  onChange: (schedule: WeeklyScheduleEntry[]) => void
}

export function WeeklyScheduleEditor({
  label,
  schedule,
  onChange,
}: WeeklyScheduleEditorProps) {
  const toggleDay = useCallback(
    (day: number) => {
      const exists = schedule.some((e) => e.day === day)
      if (exists) {
        onChange(schedule.filter((e) => e.day !== day))
      } else {
        onChange(
          [...schedule, { day, start: '09:00', end: '17:00' }].sort(
            (a, b) => a.day - b.day
          )
        )
      }
    },
    [schedule, onChange]
  )

  const updateTime = useCallback(
    (day: number, field: 'start' | 'end', value: string) => {
      onChange(
        schedule.map((e) => (e.day === day ? { ...e, [field]: value } : e))
      )
    },
    [schedule, onChange]
  )

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {DAYS.map((dayName, dayIndex) => {
        const entry = schedule.find((e) => e.day === dayIndex)
        return (
          <div key={dayIndex} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleDay(dayIndex)}
              className={`w-12 rounded border px-2 py-1 text-center text-xs font-mono transition-colors ${
                entry
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {dayName}
            </button>
            {entry && (
              <>
                <Input
                  type="time"
                  value={entry.start}
                  onChange={(e) =>
                    updateTime(dayIndex, 'start', e.target.value)
                  }
                  className="h-9 w-28"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={entry.end}
                  onChange={(e) => updateTime(dayIndex, 'end', e.target.value)}
                  className="h-9 w-28"
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
