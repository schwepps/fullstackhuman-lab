'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { SessionState, HoleProgress, ScoreResult } from '@/lib/types'
import { MULLIGANS_PER_COURSE } from '@/lib/constants'

const STORAGE_KEY = 'prompt-golf-session'

const EMPTY_HOLE: HoleProgress = {
  bestScore: null,
  bestPrompt: null,
  practiceSwings: 0,
  scoredAttempts: 0,
  isComplete: false,
  optimalPrompt: null,
  concept: null,
}

function generateSessionId(): string {
  return crypto.randomUUID()
}

function createFreshSession(): SessionState {
  return {
    sessionId: generateSessionId(),
    displayName: '',
    mulligansRemaining: {},
    holes: {},
  }
}

function loadFromStorage(): SessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionState
      if (parsed.sessionId) return parsed
    }
  } catch {
    // Corrupted storage
  }
  return null
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
  const [session, setSession] = useState<SessionState>(createFreshSession)
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    const stored = loadFromStorage()
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setSession(stored)
    }
  }, [])

  useEffect(() => {
    if (hydratedRef.current && session.sessionId) {
      saveSession(session)
    }
  }, [session])

  const setDisplayName = useCallback((name: string) => {
    setSession((prev) => ({ ...prev, displayName: name }))
  }, [])

  const getHoleProgress = useCallback(
    (challengeId: string): HoleProgress => {
      return session.holes[challengeId] ?? EMPTY_HOLE
    },
    [session.holes]
  )

  const recordPracticeSwing = useCallback((challengeId: string) => {
    setSession((prev) => {
      const hole = prev.holes[challengeId] ?? EMPTY_HOLE
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
        const hole = prev.holes[challengeId] ?? EMPTY_HOLE

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

  /** Save analysis data (optimalPrompt + concept) after a passing attempt */
  const recordAnalysis = useCallback(
    (
      challengeId: string,
      optimalPrompt: string | null,
      concept: string | null
    ) => {
      setSession((prev) => {
        const hole = prev.holes[challengeId] ?? EMPTY_HOLE
        // Only store if we don't already have it
        if (hole.optimalPrompt && hole.concept) return prev
        return {
          ...prev,
          holes: {
            ...prev.holes,
            [challengeId]: {
              ...hole,
              optimalPrompt: optimalPrompt ?? hole.optimalPrompt,
              concept: concept ?? hole.concept,
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
      recordAnalysis,
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
      recordAnalysis,
      getMulligansRemaining,
      consumeMulligan,
      completedHolesCount,
    ]
  )
}
