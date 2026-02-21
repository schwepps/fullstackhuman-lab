'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { ConsentState } from '@/lib/constants/legal'
import {
  initPostHog,
  shutdownPostHog,
  capturePageView,
} from '@/lib/analytics/posthog'

export function usePostHogLifecycle(consentState: ConsentState | null): void {
  const pathnameRef = useRef<string | null>(null)
  const pathname = usePathname()

  // Init / shutdown based on consent
  useEffect(() => {
    if (consentState === 'granted') {
      initPostHog()
    } else if (consentState === 'denied') {
      shutdownPostHog()
    }
  }, [consentState])

  // Track page views on route changes (only when PostHog is active)
  useEffect(() => {
    if (consentState !== 'granted') return
    if (pathname === pathnameRef.current) return

    pathnameRef.current = pathname
    capturePageView(window.location.href)
  }, [pathname, consentState])
}
