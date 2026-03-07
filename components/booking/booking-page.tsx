'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { MeetingTypeSelector } from './meeting-type-selector'
import { DatePicker } from './date-picker'
import { TimeSlotPicker } from './time-slot-picker'
import { BookingForm } from './booking-form'
import { BookingContextBanner } from './booking-context-banner'
import type { MeetingTypeSlug } from '@/lib/constants/booking'

type BookingStep = 'type' | 'datetime' | 'details' | 'confirming'

interface BookingPageProps {
  conversationId?: string
}

export function BookingPage({ conversationId }: BookingPageProps) {
  const t = useTranslations('booking')
  const [step, setStep] = useState<BookingStep>('type')
  const [meetingType, setMeetingType] = useState<MeetingTypeSlug | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  const handleTypeSelect = useCallback((type: MeetingTypeSlug) => {
    setMeetingType(type)
    setStep('datetime')
  }, [])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }, [])

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time)
    setStep('details')
  }, [])

  const handleBack = useCallback(() => {
    if (step === 'details') {
      setStep('datetime')
    } else if (step === 'datetime') {
      setStep('type')
      setSelectedDate(null)
      setSelectedTime(null)
    }
  }, [step])

  const handleSubmitting = useCallback(() => setStep('confirming'), [])

  const handleError = useCallback(() => setStep('details'), [])

  return (
    <div className="w-full max-w-lg">
      {conversationId && <BookingContextBanner />}

      <h1 className="terminal-text-glow mb-2 text-center text-2xl font-bold text-primary">
        {t('title')}
      </h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        {t('subtitle')}
      </p>

      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {(['type', 'datetime', 'details'] as const).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-12 rounded-full transition-colors ${
              step === s || (step === 'confirming' && s === 'details')
                ? 'bg-primary'
                : i < ['type', 'datetime', 'details'].indexOf(step)
                  ? 'bg-primary/50'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      {step === 'type' && <MeetingTypeSelector onSelect={handleTypeSelect} />}

      {step === 'datetime' && meetingType && (
        <div className="space-y-6">
          <button
            onClick={handleBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t('back')}
          </button>
          <DatePicker
            meetingType={meetingType}
            timezone={timezone}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />
          {selectedDate && (
            <TimeSlotPicker
              date={selectedDate}
              meetingType={meetingType}
              timezone={timezone}
              selectedTime={selectedTime}
              onSelect={handleTimeSelect}
            />
          )}
        </div>
      )}

      {(step === 'details' || step === 'confirming') &&
        meetingType &&
        selectedDate &&
        selectedTime && (
          <div className="space-y-6">
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground"
              disabled={step === 'confirming'}
            >
              ← {t('back')}
            </button>
            <BookingForm
              meetingType={meetingType}
              date={selectedDate}
              timeSlot={selectedTime}
              timezone={timezone}
              conversationId={conversationId}
              isSubmitting={step === 'confirming'}
              onSubmitting={handleSubmitting}
              onError={handleError}
            />
          </div>
        )}
    </div>
  )
}
