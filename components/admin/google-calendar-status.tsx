'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CalendarCheck, CalendarX } from 'lucide-react'

interface GoogleCalendarStatusProps {
  isConnected: boolean
}

export function GoogleCalendarStatus({
  isConnected,
}: GoogleCalendarStatusProps) {
  const t = useTranslations('adminDashboard.googleCalendar')

  const handleConnect = useCallback(async () => {
    const res = await fetch('/api/booking/google/authorize')
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }, [])

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CalendarCheck className="size-4" />
        {t('connected')}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarX className="size-4" />
        {t('notConnected')}
      </div>
      <Button size="sm" variant="outline" onClick={handleConnect}>
        {t('connect')}
      </Button>
    </div>
  )
}
