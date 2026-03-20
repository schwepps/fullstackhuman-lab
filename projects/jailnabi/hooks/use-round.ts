'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Round, Evidence, Defense, Verdict } from '@/lib/types'
import type { AISkill } from '@/lib/techniques'
import { BASE_PATH, MIN_EVIDENCE_FOR_COURT } from '@/lib/constants'

const POLL_INTERVAL_MS = 30_000

interface RoundState {
  round: Round | null
  evidence: Evidence[]
  defenses: Record<string, Defense>
  skill: AISkill | null
  verdict: Verdict | null
  isLoading: boolean
  error: string | null
}

export function useRound() {
  const [state, setState] = useState<RoundState>({
    round: null,
    evidence: [],
    defenses: {},
    skill: null,
    verdict: null,
    isLoading: true,
    error: null,
  })
  const [isAdvancing, setIsAdvancing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRound = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_PATH}/api/round`)
      if (!res.ok) throw new Error('Failed to fetch round')
      const data = await res.json()
      setState({
        round: data.round,
        evidence: data.evidence ?? [],
        defenses: data.defenses ?? {},
        skill: data.skill ?? null,
        verdict: data.verdict ?? null,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch',
      }))
    }
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchRound()
    intervalRef.current = setInterval(fetchRound, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchRound])

  const callCourt = useCallback(
    async (calledBy: string) => {
      setIsAdvancing(true)
      try {
        const res = await fetch(`${BASE_PATH}/api/round/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calledBy }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to advance')
        }
        await fetchRound()
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to advance',
        }))
      } finally {
        setIsAdvancing(false)
      }
    },
    [fetchRound]
  )

  const canCallCourt = state.evidence.length >= MIN_EVIDENCE_FOR_COURT

  return useMemo(
    () => ({
      ...state,
      isAdvancing,
      canCallCourt,
      callCourt,
      refresh: fetchRound,
    }),
    [state, isAdvancing, canCallCourt, callCourt, fetchRound]
  )
}
