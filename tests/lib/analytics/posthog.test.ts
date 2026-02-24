import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockInit = vi.fn()
const mockCapture = vi.fn()
const mockOptOut = vi.fn()

vi.mock('posthog-js', () => ({
  default: {
    init: (...args: unknown[]) => mockInit(...args),
    capture: (...args: unknown[]) => mockCapture(...args),
    opt_out_capturing: () => mockOptOut(),
  },
}))

vi.mock('@/lib/constants/analytics', () => ({
  POSTHOG_KEY: 'phc_test_key',
  POSTHOG_HOST: 'https://us.i.posthog.com',
  POSTHOG_STORAGE_PREFIX: 'ph_',
}))

import {
  initPostHog,
  shutdownPostHog,
  captureEvent,
  capturePageView,
  isPostHogInitialized,
} from '@/lib/analytics/posthog'

describe('PostHog analytics module', () => {
  beforeEach(() => {
    if (isPostHogInitialized()) {
      shutdownPostHog()
    }
    vi.clearAllMocks()
  })

  describe('initPostHog', () => {
    it('initializes PostHog with correct config', () => {
      initPostHog()

      expect(mockInit).toHaveBeenCalledOnce()
      expect(mockInit).toHaveBeenCalledWith(
        'phc_test_key',
        expect.objectContaining({
          api_host: 'https://us.i.posthog.com',
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: false,
          persistence: 'localStorage+cookie',
          cross_subdomain_cookie: false,
        })
      )
    })

    it('is idempotent — second call is a no-op', () => {
      initPostHog()
      initPostHog()

      expect(mockInit).toHaveBeenCalledOnce()
    })

    it('sets isPostHogInitialized to true', () => {
      expect(isPostHogInitialized()).toBe(false)
      initPostHog()
      expect(isPostHogInitialized()).toBe(true)
    })
  })

  describe('shutdownPostHog', () => {
    it('calls opt_out_capturing when initialized', () => {
      initPostHog()
      shutdownPostHog()

      expect(mockOptOut).toHaveBeenCalledOnce()
    })

    it('resets isPostHogInitialized to false', () => {
      initPostHog()
      expect(isPostHogInitialized()).toBe(true)

      shutdownPostHog()
      expect(isPostHogInitialized()).toBe(false)
    })

    it('is a no-op when not initialized', () => {
      shutdownPostHog()
      expect(mockOptOut).not.toHaveBeenCalled()
    })
  })

  describe('captureEvent', () => {
    it('forwards event to posthog.capture when initialized', () => {
      initPostHog()
      captureEvent('persona_selected', { key: 'value' })

      expect(mockCapture).toHaveBeenCalledWith('persona_selected', {
        key: 'value',
      })
    })

    it('is a no-op when not initialized', () => {
      captureEvent('persona_selected', { key: 'value' })

      expect(mockCapture).not.toHaveBeenCalled()
    })

    it('is a no-op after shutdown', () => {
      initPostHog()
      shutdownPostHog()
      vi.clearAllMocks()

      captureEvent('persona_selected')

      expect(mockCapture).not.toHaveBeenCalled()
    })
  })

  describe('capturePageView', () => {
    it('sends $pageview event with $current_url when initialized', () => {
      initPostHog()
      capturePageView('https://fullstackhuman.sh/chat')

      expect(mockCapture).toHaveBeenCalledWith('$pageview', {
        $current_url: 'https://fullstackhuman.sh/chat',
      })
    })

    it('is a no-op when not initialized', () => {
      capturePageView('https://fullstackhuman.sh/')

      expect(mockCapture).not.toHaveBeenCalled()
    })
  })

  describe('full lifecycle', () => {
    it('init → capture works → shutdown → capture no-ops', () => {
      captureEvent('persona_selected')
      expect(mockCapture).not.toHaveBeenCalled()

      initPostHog()
      captureEvent('persona_selected', { step: 1 })
      expect(mockCapture).toHaveBeenCalledWith('persona_selected', {
        step: 1,
      })

      shutdownPostHog()
      vi.clearAllMocks()
      captureEvent('persona_selected')
      expect(mockCapture).not.toHaveBeenCalled()
    })
  })
})
