'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { SessionState, HoleProgress, ScoreResult } from '@/lib/types'
import { MULLIGANS_PER_COURSE } from '@/lib/constants'

const STORAGE_KEY = 'prompt-golf-session'

function generateSessionId(): string {
  return crypto.randomUUID()
}

function loadSession(): SessionState {
  if (typeof window === 'undefined') return createFreshSession()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionState
      if (parsed.sessionId) return parsed
    }
  } catch {
    // Corrupted storage — reset
  }

  return createFreshSession()
}

function createFreshSession(): SessionState {
  return {
    sessionId: generateSessionId(),
    displayName: '',
    mulligansRemaining: {},
    holes: {},
  }
}

function saveSession(session: SessionState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage full or disabled
  }
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(loadSession)

  // Persist on every change (skip initial SSR render)
  const isHydrated = typeof window !== 'undefined'
  useEffect(() => {
    if (isHydrated && session.sessionId) {
      saveSession(session)
    }
  }, [session, isHydrated])

  const setDisplayName = useCallback((name: string) => {
    setSession((prev) => ({ ...prev, displayName: name }))
  }, [])

  const getHoleProgress = useCallback(
    (challengeId: string): HoleProgress => {
      return (
        session.holes[challengeId] ?? {
          bestScore: null,
          bestPrompt: null,
          practiceSwings: 0,
          scoredAttempts: 0,
          isComplete: false,
        }
      )
    },
    [session.holes]
  )

  const recordPracticeSwing = useCallback((challengeId: string) => {
    setSession((prev) => {
      const hole = prev.holes[challengeId] ?? {
        bestScore: null,
        bestPrompt: null,
        practiceSwings: 0,
        scoredAttempts: 0,
        isComplete: false,
      }
      return {
        ...prev,
        holes: {
          ...prev.holes,
          [challengeId]: {
            ...hole,
            practiceSwings: hole.practiceSwings + 1,
          },
        },
      }
    })
  }, [])

  const recordScoredAttempt = useCallback(
    (challengeId: string, score: ScoreResult, prompt: string) => {
      setSession((prev) => {
        const hole = prev.holes[challengeId] ?? {
          bestScore: null,
          bestPrompt: null,
          practiceSwings: 0,
          scoredAttempts: 0,
          isComplete: false,
        }

        const isBetter =
          score.isPassing &&
          (hole.bestScore == null ||
            score.effectiveStrokes < hole.bestScore.effectiveStrokes)

        return {
          ...prev,
          holes: {
            ...prev.holes,
            [challengeId]: {
              ...hole,
              scoredAttempts: hole.scoredAttempts + 1,
              isComplete: hole.isComplete || score.isPassing,
              bestScore: isBetter ? score : hole.bestScore,
              bestPrompt: isBetter ? prompt : hole.bestPrompt,
            },
          },
        }
      })
    },
    []
  )

  const getMulligansRemaining = useCallback(
    (course: string): number => {
      return session.mulligansRemaining[course] ?? MULLIGANS_PER_COURSE
    },
    [session.mulligansRemaining]
  )

  const consumeMulligan = useCallback((course: string) => {
    setSession((prev) => {
      const current = prev.mulligansRemaining[course] ?? MULLIGANS_PER_COURSE
      if (current <= 0) return prev
      return {
        ...prev,
        mulligansRemaining: {
          ...prev.mulligansRemaining,
          [course]: current - 1,
        },
      }
    })
  }, [])

  const completedHolesCount = useMemo(
    () => Object.values(session.holes).filter((h) => h.isComplete).length,
    [session.holes]
  )

  return useMemo(
    () => ({
      session,
      setDisplayName,
      getHoleProgress,
      recordPracticeSwing,
      recordScoredAttempt,
      getMulligansRemaining,
      consumeMulligan,
      completedHolesCount,
    }),
    [
      session,
      setDisplayName,
      getHoleProgress,
      recordPracticeSwing,
      recordScoredAttempt,
      getMulligansRemaining,
      consumeMulligan,
      completedHolesCount,
    ]
  )
}
