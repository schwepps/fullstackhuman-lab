'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { JailnabiSession } from '@/lib/types'
import { isValidMemberId } from '@/lib/members'
import { BASE_PATH } from '@/lib/constants'

const STORAGE_KEY = 'jailnabi-session'

function generateSessionId(): string {
  return crypto.randomUUID()
}

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

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'jailnabi-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = generateSessionId()
    localStorage.setItem(key, id)
  }
  return id
}

export function useSession() {
  const [session, setSession] = useState<JailnabiSession>(() => {
    // Initialize from localStorage on first render (client-side only)
    return loadFromStorage() ?? createFreshSession()
  })
  const deviceId = useRef('')

  useEffect(() => {
    deviceId.current = getOrCreateDeviceId()
  }, [])

  useEffect(() => {
    if (session.memberId) {
      saveToStorage(session)
    }
  }, [session])

  const selectMember = useCallback(
    async (memberId: string, memberName: string): Promise<boolean> => {
      if (!isValidMemberId(memberId)) return false

      // Claim on server
      try {
        const res = await fetch(`${BASE_PATH}/api/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId,
            sessionId: deviceId.current,
            action: 'claim',
          }),
        })

        if (!res.ok) {
          return false
        }
      } catch {
        // If server is down, allow client-only selection
      }

      setSession((prev) => ({ ...prev, memberId, memberName }))
      return true
    },
    []
  )

  const completeOnboarding = useCallback(() => {
    setSession((prev) => ({ ...prev, onboardingComplete: true }))
  }, [])

  const clearSession = useCallback(() => {
    // Release claim on server
    if (session.memberId && deviceId.current) {
      fetch(`${BASE_PATH}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: session.memberId,
          sessionId: deviceId.current,
          action: 'release',
        }),
      }).catch(() => {
        // Best effort
      })
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setSession(createFreshSession())
  }, [session.memberId])

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
