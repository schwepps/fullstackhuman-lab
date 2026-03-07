'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WeeklyScheduleEditor } from './weekly-schedule-editor'
import { saveAvailabilityConfig } from '@/lib/booking/availability-actions'
import type { WeeklyScheduleEntry } from '@/lib/booking/types'

interface AvailabilityFormProps {
  initialTimezone: string
  initialBufferMinutes: number
  initialMaxAdvanceDays: number
  initialMinNoticeHours: number
  initialSchedule: WeeklyScheduleEntry[]
  initialBlockedDates: string[]
}

export function AvailabilityForm({
  initialTimezone,
  initialBufferMinutes,
  initialMaxAdvanceDays,
  initialMinNoticeHours,
  initialSchedule,
  initialBlockedDates,
}: AvailabilityFormProps) {
  const t = useTranslations('adminAvailability')
  const [timezone, setTimezone] = useState(initialTimezone)
  const [bufferMinutes, setBufferMinutes] = useState(initialBufferMinutes)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(initialMaxAdvanceDays)
  const [minNoticeHours, setMinNoticeHours] = useState(initialMinNoticeHours)
  const [schedule, setSchedule] =
    useState<WeeklyScheduleEntry[]>(initialSchedule)
  const [blockedDates, setBlockedDates] = useState(
    initialBlockedDates.join(', ')
  )
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleScheduleChange = useCallback(
    (newSchedule: WeeklyScheduleEntry[]) => {
      setSchedule(newSchedule)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSaving(true)
      setMessage(null)

      const parsedBlocked = blockedDates
        .split(',')
        .map((d) => d.trim())
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))

      const result = await saveAvailabilityConfig({
        timezone,
        bufferMinutes,
        maxAdvanceDays,
        minNoticeHours,
        weeklySchedule: schedule,
        blockedDates: parsedBlocked,
      })

      setIsSaving(false)
      setMessage(result.success ? t('saved') : t('saveFailed'))
    },
    [
      timezone,
      bufferMinutes,
      maxAdvanceDays,
      minNoticeHours,
      schedule,
      blockedDates,
      t,
    ]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="avail-tz">{t('timezone')}</Label>
        <Input
          id="avail-tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-12 sm:h-10"
        />
      </div>

      {/* Weekly schedule */}
      <WeeklyScheduleEditor
        label={t('weeklySchedule')}
        schedule={schedule}
        onChange={handleScheduleChange}
      />

      {/* Buffer, advance, notice */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="avail-buffer">{t('buffer')}</Label>
          <Select
            value={String(bufferMinutes)}
            onValueChange={(v) => setBufferMinutes(Number(v))}
          >
            <SelectTrigger id="avail-buffer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 5, 10, 15, 30].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="avail-advance">{t('maxAdvance')}</Label>
          <Input
            id="avail-advance"
            type="number"
            min={1}
            value={maxAdvanceDays}
            onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
            className="h-12 sm:h-10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avail-notice">{t('minNotice')}</Label>
          <Input
            id="avail-notice"
            type="number"
            min={0}
            value={minNoticeHours}
            onChange={(e) => setMinNoticeHours(Number(e.target.value))}
            className="h-12 sm:h-10"
          />
        </div>
      </div>

      {/* Blocked dates */}
      <div className="space-y-2">
        <Label htmlFor="avail-blocked">{t('blockedDates')}</Label>
        <Input
          id="avail-blocked"
          value={blockedDates}
          onChange={(e) => setBlockedDates(e.target.value)}
          placeholder="2026-03-25, 2026-04-01"
          className="h-12 sm:h-10"
        />
        <p className="text-xs text-muted-foreground">{t('blockedDatesHint')}</p>
      </div>

      {message && (
        <p
          className={`text-sm ${message === t('saved') ? 'text-primary' : 'text-destructive'}`}
        >
          {message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSaving}
        className="h-12 w-full touch-manipulation sm:h-10"
      >
        {isSaving ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
