import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePostHogLifecycle } from '@/lib/hooks/use-posthog-lifecycle'
import type { ConsentState } from '@/lib/constants/legal'

const mockInitPostHog = vi.fn()
const mockShutdownPostHog = vi.fn()
const mockCapturePageView = vi.fn()

vi.mock('@/lib/analytics/posthog', () => ({
  initPostHog: (...args: unknown[]) => mockInitPostHog(...args),
  shutdownPostHog: (...args: unknown[]) => mockShutdownPostHog(...args),
  capturePageView: (...args: unknown[]) => mockCapturePageView(...args),
}))

let mockPathname = '/chat'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('usePostHogLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/chat'
  })

  describe('consent handling', () => {
    it('calls initPostHog when consent is granted', () => {
      renderHook(() => usePostHogLifecycle('granted'))

      expect(mockInitPostHog).toHaveBeenCalledOnce()
    })

    it('calls shutdownPostHog when consent is denied', () => {
      renderHook(() => usePostHogLifecycle('denied'))

      expect(mockShutdownPostHog).toHaveBeenCalledOnce()
    })

    it('does nothing when consent is null', () => {
      renderHook(() => usePostHogLifecycle(null))

      expect(mockInitPostHog).not.toHaveBeenCalled()
      expect(mockShutdownPostHog).not.toHaveBeenCalled()
    })

    it('transitions from granted to denied calls shutdown', () => {
      const { rerender } = renderHook(
        ({ consent }: { consent: ConsentState | null }) =>
          usePostHogLifecycle(consent),
        { initialProps: { consent: 'granted' as ConsentState | null } }
      )

      rerender({ consent: 'denied' })

      expect(mockInitPostHog).toHaveBeenCalledOnce()
      expect(mockShutdownPostHog).toHaveBeenCalledOnce()
    })
  })

  describe('page view tracking', () => {
    it('captures page view when consent is granted', () => {
      renderHook(() => usePostHogLifecycle('granted'))

      expect(mockCapturePageView).toHaveBeenCalledOnce()
      expect(mockCapturePageView).toHaveBeenCalledWith(expect.any(String))
    })

    it('does not capture page view when consent is denied', () => {
      renderHook(() => usePostHogLifecycle('denied'))

      expect(mockCapturePageView).not.toHaveBeenCalled()
    })

    it('does not capture page view when consent is null', () => {
      renderHook(() => usePostHogLifecycle(null))

      expect(mockCapturePageView).not.toHaveBeenCalled()
    })

    it('does not re-capture page view for same pathname on rerender', () => {
      const { rerender } = renderHook(() => usePostHogLifecycle('granted'))

      expect(mockCapturePageView).toHaveBeenCalledOnce()
      mockCapturePageView.mockClear()

      rerender()

      expect(mockCapturePageView).not.toHaveBeenCalled()
    })

    it('captures page view when pathname changes', () => {
      const { rerender } = renderHook(() => usePostHogLifecycle('granted'))

      expect(mockCapturePageView).toHaveBeenCalledOnce()
      mockCapturePageView.mockClear()

      mockPathname = '/new-page'
      rerender()

      expect(mockCapturePageView).toHaveBeenCalledOnce()
    })
  })
})
