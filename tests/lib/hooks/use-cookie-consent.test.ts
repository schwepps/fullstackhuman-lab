import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CONSENT_COOKIE_NAME } from '@/lib/constants/legal'
import { useCookieConsent } from '@/lib/hooks/use-cookie-consent'

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/`
}

describe('useCookieConsent', () => {
  beforeEach(() => {
    clearCookie(CONSENT_COOKIE_NAME)
  })

  it('returns null consentState and opens banner when no cookie exists', () => {
    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consentState).toBeNull()
    expect(result.current.isOpen).toBe(true)
  })

  it('returns "granted" and does not open banner when consent cookie is granted', () => {
    setCookie(CONSENT_COOKIE_NAME, 'granted')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consentState).toBe('granted')
    expect(result.current.isOpen).toBe(false)
  })

  it('returns "denied" and does not open banner when consent cookie is denied', () => {
    setCookie(CONSENT_COOKIE_NAME, 'denied')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consentState).toBe('denied')
    expect(result.current.isOpen).toBe(false)
  })

  it('closes banner and writes cookie on grantConsent', () => {
    const { result } = renderHook(() => useCookieConsent())

    act(() => {
      result.current.grantConsent()
    })

    expect(result.current.isOpen).toBe(false)
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=granted`)
  })

  it('closes banner and writes cookie on denyConsent', () => {
    const { result } = renderHook(() => useCookieConsent())

    act(() => {
      result.current.denyConsent()
    })

    expect(result.current.isOpen).toBe(false)
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=denied`)
  })

  it('re-opens banner on openBanner', () => {
    setCookie(CONSENT_COOKIE_NAME, 'granted')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.openBanner()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('treats invalid cookie value as no consent', () => {
    setCookie(CONSENT_COOKIE_NAME, 'invalid')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consentState).toBeNull()
    expect(result.current.isOpen).toBe(true)
  })

  it('updates consentState after grantConsent', () => {
    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consentState).toBeNull()

    act(() => {
      result.current.grantConsent()
    })

    expect(result.current.consentState).toBe('granted')
  })
})
