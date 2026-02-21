import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { ANALYTICS_EVENTS } from '@/lib/constants/analytics'

const mockCaptureEvent = vi.fn()

vi.mock('@/lib/analytics/posthog', () => ({
  captureEvent: (...args: unknown[]) => mockCaptureEvent(...args),
}))

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all track functions', () => {
    const { result } = renderHook(() => useAnalytics())

    expect(result.current.trackPersonaSelected).toBeTypeOf('function')
    expect(result.current.trackReportGenerated).toBeTypeOf('function')
    expect(result.current.trackReportCopied).toBeTypeOf('function')
    expect(result.current.trackCalendlyClick).toBeTypeOf('function')
    expect(result.current.trackCtaClick).toBeTypeOf('function')
  })

  it('returns referentially stable functions across re-renders', () => {
    const { result, rerender } = renderHook(() => useAnalytics())

    const firstRender = { ...result.current }
    rerender()

    expect(result.current.trackPersonaSelected).toBe(
      firstRender.trackPersonaSelected
    )
    expect(result.current.trackReportGenerated).toBe(
      firstRender.trackReportGenerated
    )
    expect(result.current.trackReportCopied).toBe(firstRender.trackReportCopied)
    expect(result.current.trackCalendlyClick).toBe(
      firstRender.trackCalendlyClick
    )
    expect(result.current.trackCtaClick).toBe(firstRender.trackCtaClick)
  })

  it('trackPersonaSelected calls captureEvent with correct event name', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackPersonaSelected({ persona: 'doctor' })

    expect(mockCaptureEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.PERSONA_SELECTED,
      { persona: 'doctor' }
    )
  })

  it('trackReportGenerated calls captureEvent with correct event name', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackReportGenerated({
      persona: 'critic',
      message_count: 8,
    })

    expect(mockCaptureEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.REPORT_GENERATED,
      { persona: 'critic', message_count: 8 }
    )
  })

  it('trackReportCopied calls captureEvent with correct event name', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackReportCopied({ persona: 'guide' })

    expect(mockCaptureEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.REPORT_COPIED,
      { persona: 'guide' }
    )
  })

  it('trackCalendlyClick calls captureEvent with correct event name', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackCalendlyClick({ source: 'report' })

    expect(mockCaptureEvent).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.CALENDLY_CLICK,
      { source: 'report' }
    )
  })

  it('trackCtaClick calls captureEvent with correct event name', () => {
    const { result } = renderHook(() => useAnalytics())

    result.current.trackCtaClick({ source: 'hero' })

    expect(mockCaptureEvent).toHaveBeenCalledWith(ANALYTICS_EVENTS.CTA_CLICK, {
      source: 'hero',
    })
  })
})
