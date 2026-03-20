'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { JailnabiSession } from '@/lib/types'
import { isValidMemberId } from '@/lib/members'

const STORAGE_KEY = 'jailnabi-session'

function createFreshSession(): JailnabiSession {
  return {
    memberId: '',
    memberName: '',
    onboardingComplete: false,
  }
}

function loadFromStorage(): JailnabiSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as JailnabiSession
      if (
        typeof parsed.memberId === 'string' &&
        typeof parsed.memberName === 'string' &&
        isValidMemberId(parsed.memberId)
      ) {
        return parsed
      }
    }
  } catch {
    // Corrupted storage
  }
  return null
}

function saveToStorage(session: JailnabiSession): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage full or disabled
  }
}

export function useSession() {
  const [session, setSession] = useState<JailnabiSession>(createFreshSession)
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const stored = loadFromStorage()
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration
      setSession(stored)
    }
  }, [])

  useEffect(() => {
    if (hydratedRef.current && session.memberId) {
      saveToStorage(session)
    }
  }, [session])

  const selectMember = useCallback((memberId: string, memberName: string) => {
    if (!isValidMemberId(memberId)) return
    setSession((prev) => ({ ...prev, memberId, memberName }))
  }, [])

  const completeOnboarding = useCallback(() => {
    setSession((prev) => ({ ...prev, onboardingComplete: true }))
  }, [])

  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setSession(createFreshSession())
  }, [])

  const isIdentified = session.memberId !== ''

  return useMemo(
    () => ({
      session,
      isIdentified,
      selectMember,
      completeOnboarding,
      clearSession,
    }),
    [session, isIdentified, selectMember, completeOnboarding, clearSession]
  )
}
