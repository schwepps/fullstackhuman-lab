'use client'

import { useCallback, useMemo } from 'react'
import { captureEvent } from '@/lib/analytics/posthog'
import {
  ANALYTICS_EVENTS,
  type PersonaSelectedProperties,
  type ReportGeneratedProperties,
  type ReportCopiedProperties,
  type BookingClickProperties,
  type TelegramClickProperties,
  type CtaClickProperties,
  type ReportLinkCopiedProperties,
} from '@/lib/constants/analytics'

interface UseAnalyticsResult {
  trackPersonaSelected: (props: PersonaSelectedProperties) => void
  trackReportGenerated: (props: ReportGeneratedProperties) => void
  trackReportCopied: (props: ReportCopiedProperties) => void
  trackBookingClick: (props: BookingClickProperties) => void
  trackTelegramClick: (props: TelegramClickProperties) => void
  trackCtaClick: (props: CtaClickProperties) => void
  trackReportLinkCopied: (props: ReportLinkCopiedProperties) => void
}

export function useAnalytics(): UseAnalyticsResult {
  const trackPersonaSelected = useCallback(
    (props: PersonaSelectedProperties) => {
      captureEvent(ANALYTICS_EVENTS.PERSONA_SELECTED, props)
    },
    []
  )

  const trackReportGenerated = useCallback(
    (props: ReportGeneratedProperties) => {
      captureEvent(ANALYTICS_EVENTS.REPORT_GENERATED, props)
    },
    []
  )

  const trackReportCopied = useCallback((props: ReportCopiedProperties) => {
    captureEvent(ANALYTICS_EVENTS.REPORT_COPIED, props)
  }, [])

  const trackBookingClick = useCallback((props: BookingClickProperties) => {
    captureEvent(ANALYTICS_EVENTS.BOOKING_CLICK, props)
  }, [])

  const trackTelegramClick = useCallback((props: TelegramClickProperties) => {
    captureEvent(ANALYTICS_EVENTS.TELEGRAM_CLICK, props)
  }, [])

  const trackCtaClick = useCallback((props: CtaClickProperties) => {
    captureEvent(ANALYTICS_EVENTS.CTA_CLICK, props)
  }, [])

  const trackReportLinkCopied = useCallback(
    (props: ReportLinkCopiedProperties) => {
      captureEvent(ANALYTICS_EVENTS.REPORT_LINK_COPIED, props)
    },
    []
  )

  return useMemo(
    () => ({
      trackPersonaSelected,
      trackReportGenerated,
      trackReportCopied,
      trackBookingClick,
      trackTelegramClick,
      trackCtaClick,
      trackReportLinkCopied,
    }),
    [
      trackPersonaSelected,
      trackReportGenerated,
      trackReportCopied,
      trackBookingClick,
      trackTelegramClick,
      trackCtaClick,
      trackReportLinkCopied,
    ]
  )
}
