'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { DatePicker } from './date-picker'
import { TimeSlotPicker } from './time-slot-picker'
import { BookingForm } from './booking-form'
import { BookingContextBanner } from './booking-context-banner'

type BookingStep = 'datetime' | 'details' | 'confirming'

interface BookingPageProps {
  conversationId?: string
}

export function BookingPage({ conversationId }: BookingPageProps) {
  const t = useTranslations('booking')
  const [step, setStep] = useState<BookingStep>('datetime')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  )

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
        {(['datetime', 'details'] as const).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-12 rounded-full transition-colors ${
              step === s || (step === 'confirming' && s === 'details')
                ? 'bg-primary'
                : i < ['datetime', 'details'].indexOf(step)
                  ? 'bg-primary/50'
                  : 'bg-border'
            }`}
          />
        ))}
      </div>

      {step === 'datetime' && (
        <div className="flex flex-col items-center space-y-6">
          <DatePicker
            meetingType="intro"
            timezone={timezone}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />
          {selectedDate && (
            <TimeSlotPicker
              date={selectedDate}
              meetingType="intro"
              timezone={timezone}
              selectedTime={selectedTime}
              onSelect={handleTimeSelect}
            />
          )}
        </div>
      )}

      {(step === 'details' || step === 'confirming') &&
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
              meetingType="intro"
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
