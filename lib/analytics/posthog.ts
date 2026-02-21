import posthog from 'posthog-js'
import {
  POSTHOG_KEY,
  POSTHOG_HOST,
  POSTHOG_STORAGE_PREFIX,
  type AnalyticsEventName,
} from '@/lib/constants/analytics'

let isInitialized = false

export function initPostHog(): void {
  if (isInitialized || !POSTHOG_KEY || typeof window === 'undefined') return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: false,
  })

  isInitialized = true
}

export function shutdownPostHog(): void {
  if (!isInitialized) return

  posthog.opt_out_capturing()

  // Clear PostHog cookies to comply with consent withdrawal
  if (typeof document !== 'undefined') {
    document.cookie
      .split('; ')
      .filter((c) => c.startsWith(POSTHOG_STORAGE_PREFIX))
      .forEach((c) => {
        const name = c.split('=')[0]
        document.cookie = `${name}=; Max-Age=0; Path=/`
      })
  }

  // Clear PostHog localStorage entries
  if (typeof localStorage !== 'undefined') {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(POSTHOG_STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  }

  isInitialized = false
}

/** Low-level API for non-React contexts. In components/hooks, use `useAnalytics()` instead. */
export function captureEvent<T extends object>(
  eventName: AnalyticsEventName,
  properties?: T
): void {
  if (!isInitialized) return
  posthog.capture(eventName, properties as Record<string, unknown>)
}

export function capturePageView(url: string): void {
  if (!isInitialized) return
  // $pageview and $current_url are PostHog reserved event/property names
  posthog.capture('$pageview', { $current_url: url })
}

export function isPostHogInitialized(): boolean {
  return isInitialized
}
