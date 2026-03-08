'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBooking } from '@/lib/booking/actions'
import type { MeetingTypeSlug } from '@/lib/constants/booking'

interface BookingFormProps {
  meetingType: MeetingTypeSlug
  date: string
  timeSlot: string
  timezone: string
  conversationId?: string
  isSubmitting: boolean
  onSubmitting: () => void
  onError: () => void
}

export function BookingForm({
  meetingType,
  date,
  timeSlot,
  timezone,
  conversationId,
  isSubmitting,
  onSubmitting,
  onError,
}: BookingFormProps) {
  const t = useTranslations('booking')
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      onSubmitting()

      const result = await createBooking({
        meetingType,
        date,
        timeSlot,
        timezone,
        name: name.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
        conversationId,
      })

      if (result.success) {
        router.push(`/book/confirmation?id=${result.bookingId}`)
      } else {
        setError(result.error)
        onError()
      }
    },
    [
      meetingType,
      date,
      timeSlot,
      timezone,
      name,
      email,
      message,
      conversationId,
      onSubmitting,
      onError,
      router,
    ]
  )

  const meetingTypeLabel = t('meetingTypes.intro.title')

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Summary */}
      <div className="terminal-border rounded-md border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('meetingType')}</span>
          <span className="font-medium text-foreground">
            {meetingTypeLabel}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('dateTime')}</span>
          <span className="font-mono font-medium text-foreground">
            {date} {timeSlot}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="booking-name">{t('form.name')}</Label>
        <Input
          id="booking-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="h-12 sm:h-10"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="booking-email">{t('form.email')}</Label>
        <Input
          id="booking-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="h-12 sm:h-10"
        />
      </div>

      {/* Message (optional) */}
      <div className="space-y-2">
        <Label htmlFor="booking-message">
          {t('form.message')}{' '}
          <span className="text-muted-foreground">({t('form.optional')})</span>
        </Label>
        <textarea
          id="booking-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error === 'slot_unavailable'
            ? t('errors.slotTaken')
            : error === 'booking_rate_limited'
              ? t('errors.rateLimited')
              : t('errors.generic')}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !name.trim() || !email.trim()}
        className="h-12 w-full touch-manipulation sm:h-10"
      >
        {isSubmitting ? t('form.submitting') : t('form.submit')}
      </Button>
    </form>
  )
}
