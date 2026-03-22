'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { BASE_PATH } from '@/lib/constants'
import type {
  Room,
  Player,
  RoundMessage,
  RoundVotes,
  GuiltScore,
  FinalVerdict,
  AISkill,
} from '@/lib/types'

const POLL_INTERVAL_MS = 3_000 // 3s — game is real-time-ish

interface RoomState {
  room: Room | null
  players: Player[]
  currentRoundMessages: RoundMessage[]
  currentRoundVotes: RoundVotes
  scores: GuiltScore[]
  verdict: FinalVerdict | null
  aiTip: string | null
  skill: AISkill | null
  isLoading: boolean
  error: string | null
}

export function useRoom(code: string) {
  const [state, setState] = useState<RoomState>({
    room: null,
    players: [],
    currentRoundMessages: [],
    currentRoundVotes: {},
    scores: [],
    verdict: null,
    aiTip: null,
    skill: null,
    isLoading: true,
    error: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_PATH}/api/room/${code}`)
      if (!res.ok) {
        if (res.status === 404) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Room not found',
          }))
          return
        }
        throw new Error('Failed to fetch room')
      }
      const data = await res.json()
      setState({
        room: data.room,
        players: data.players ?? [],
        currentRoundMessages: data.currentRoundMessages ?? [],
        currentRoundVotes: data.currentRoundVotes ?? {},
        scores: data.scores ?? [],
        verdict: data.verdict ?? null,
        aiTip: data.aiTip ?? null,
        skill: data.skill ?? null,
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
  }, [code])

  useEffect(() => {
    fetchRoom()
    intervalRef.current = setInterval(fetchRoom, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchRoom])

  return useMemo(() => ({ ...state, refresh: fetchRoom }), [state, fetchRoom])
}
