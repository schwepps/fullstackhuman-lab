'use client'

import { createContext, useContext, useMemo } from 'react'
import { useCookieConsent } from '@/lib/hooks/use-cookie-consent'
import { usePostHogLifecycle } from '@/lib/hooks/use-posthog-lifecycle'
import { CookieConsentBanner } from '@/components/layout/cookie-consent-banner'
import type { ConsentState } from '@/lib/constants/legal'

interface CookieConsentContextValue {
  openBanner: () => void
  consentState: ConsentState | null
}

const CookieConsentContext = createContext<CookieConsentContextValue>({
  openBanner: () => {},
  consentState: null,
})

export function useCookieConsentContext() {
  return useContext(CookieConsentContext)
}

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { consentState, isOpen, grantConsent, denyConsent, openBanner } =
    useCookieConsent()

  usePostHogLifecycle(consentState)

  const contextValue = useMemo(
    () => ({ openBanner, consentState }),
    [openBanner, consentState]
  )

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      <CookieConsentBanner
        isOpen={isOpen}
        onAccept={grantConsent}
        onDecline={denyConsent}
      />
    </CookieConsentContext.Provider>
  )
}
