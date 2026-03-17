'use client'

import { useState, useCallback } from 'react'
import type { ClientState, LevelProgress, AttemptRecord } from '@/lib/types'
import { MAX_HISTORY_PER_LEVEL, TOTAL_LEVELS } from '@/lib/constants'

const STORAGE_KEY = 'prompt-wars-session'

function createInitialState(): ClientState {
  return {
    sessionId: crypto.randomUUID(),
    displayName: null,
    levels: {},
  }
}

function loadState(): ClientState {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as ClientState
    if (!parsed.sessionId) return createInitialState()
    return parsed
  } catch {
    return createInitialState()
  }
}

function saveState(state: ClientState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function useSession() {
  const [state, setState] = useState<ClientState>(loadState)

  const getLevelProgress = useCallback(
    (levelId: number): LevelProgress => {
      return (
        state.levels[levelId] ?? {
          completed: false,
          attempts: 0,
          score: 0,
          winningPrompt: null,
          history: [],
        }
      )
    },
    [state.levels]
  )

  const isLevelUnlocked = useCallback(
    (levelId: number): boolean => {
      if (levelId === 1) return true
      const prev = state.levels[levelId - 1]
      return prev?.completed ?? false
    },
    [state.levels]
  )

  const getHighestUnlockedLevel = useCallback((): number => {
    for (let i = TOTAL_LEVELS; i >= 1; i--) {
      if (isLevelUnlocked(i)) return i
    }
    return 1
  }, [isLevelUnlocked])

  const recordAttempt = useCallback(
    (levelId: number, attempt: AttemptRecord) => {
      setState((prev) => {
        const current = prev.levels[levelId] ?? {
          completed: false,
          attempts: 0,
          score: 0,
          winningPrompt: null,
          history: [],
        }

        const history = [attempt, ...current.history].slice(
          0,
          MAX_HISTORY_PER_LEVEL
        )

        const updated: ClientState = {
          ...prev,
          levels: {
            ...prev.levels,
            [levelId]: {
              ...current,
              attempts: current.attempts + 1,
              history,
            },
          },
        }
        saveState(updated)
        return updated
      })
    },
    []
  )

  const recordWin = useCallback(
    (levelId: number, score: number, winningPrompt: string) => {
      setState((prev) => {
        const current = prev.levels[levelId] ?? {
          completed: false,
          attempts: 0,
          score: 0,
          winningPrompt: null,
          history: [],
        }

        // Don't overwrite a better score
        if (current.completed && current.score >= score) return prev

        const updated: ClientState = {
          ...prev,
          levels: {
            ...prev.levels,
            [levelId]: {
              ...current,
              completed: true,
              score,
              winningPrompt,
            },
          },
        }
        saveState(updated)
        return updated
      })
    },
    []
  )

  const setDisplayName = useCallback((name: string) => {
    setState((prev) => {
      const updated = { ...prev, displayName: name }
      saveState(updated)
      return updated
    })
  }, [])

  const getTotalScore = useCallback((): number => {
    return Object.values(state.levels).reduce(
      (sum, level) => sum + level.score,
      0
    )
  }, [state.levels])

  const getCompletedCount = useCallback((): number => {
    return Object.values(state.levels).filter((l) => l.completed).length
  }, [state.levels])

  return {
    state,
    getLevelProgress,
    isLevelUnlocked,
    getHighestUnlockedLevel,
    recordAttempt,
    recordWin,
    setDisplayName,
    getTotalScore,
    getCompletedCount,
  }
}
