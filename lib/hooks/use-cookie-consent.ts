'use client'

import { useSyncExternalStore, useState, useCallback, useMemo } from 'react'
import {
  CONSENT_COOKIE_NAME,
  CONSENT_COOKIE_MAX_AGE_SECONDS,
  type ConsentState,
} from '@/lib/constants/legal'

interface CookieConsentHookResult {
  consentState: ConsentState | null
  isOpen: boolean
  grantConsent: () => void
  denyConsent: () => void
  openBanner: () => void
}

function readConsentCookie(): ConsentState | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`))
  if (!match) return null
  const value = decodeURIComponent(match.split('=').slice(1).join('='))
  if (value === 'granted' || value === 'denied') return value
  return null
}

// Notify useSyncExternalStore subscribers when the cookie changes
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function writeConsentCookie(state: ConsentState): void {
  const maxAge = CONSENT_COOKIE_MAX_AGE_SECONDS
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE_NAME}=${state}; Max-Age=${maxAge}; Path=/; SameSite=Strict${secure}`
  emitChange()
}

function getServerSnapshot(): ConsentState | null {
  return null
}

export function useCookieConsent(): CookieConsentHookResult {
  const consentState = useSyncExternalStore(
    subscribe,
    readConsentCookie,
    getServerSnapshot
  )

  // isOpenOverride: null = use default (show if no decision), boolean = user interaction
  const [isOpenOverride, setIsOpenOverride] = useState<boolean | null>(null)
  const isOpen = isOpenOverride ?? consentState === null

  const grantConsent = useCallback(() => {
    writeConsentCookie('granted')
    setIsOpenOverride(false)
  }, [])

  const denyConsent = useCallback(() => {
    writeConsentCookie('denied')
    setIsOpenOverride(false)
  }, [])

  const openBanner = useCallback(() => {
    setIsOpenOverride(true)
  }, [])

  return useMemo(
    () => ({ consentState, isOpen, grantConsent, denyConsent, openBanner }),
    [consentState, isOpen, grantConsent, denyConsent, openBanner]
  )
}
