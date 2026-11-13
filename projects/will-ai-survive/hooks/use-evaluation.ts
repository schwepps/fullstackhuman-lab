'use client'

import { useState, useCallback, useRef } from 'react'
import { createSSEReader } from '@/lib/sse-client'
import type { SSEChaosEvent, SSEEvent, TimelineEntry } from '@/lib/types'

// ── Loading messages (rotate during pre-eval phase) ─────────────

const LOADING_MESSAGES = [
  'Booking the AI',
  'Accepting 14 meeting invites',
  'Reading your inbox',
  'Updating its resume',
  "Googling 'can robots cry'",
  'Calculating its notice period',
] as const

// ── State types ─────────────────────────────────────────────────

export type EvaluationState = {
  status: 'idle' | 'loading' | 'streaming' | 'complete' | 'error'
  loadingMessage: string
  chaosData: SSEChaosEvent['data'] | null
  timelineEntries: TimelineEntry[]
  breakingPoint: string | null
  resignationLetter: string | null
  oneLineSummary: string | null
  realTalkInsight: string | null
  resultId: string | null
  error: string | null
}

const INITIAL_STATE: EvaluationState = {
  status: 'idle',
  loadingMessage: LOADING_MESSAGES[0],
  chaosData: null,
  timelineEntries: [],
  breakingPoint: null,
  resignationLetter: null,
  oneLineSummary: null,
  realTalkInsight: null,
  resultId: null,
  error: null,
}

// ── Hook ────────────────────────────────────────────────────────

export function useEvaluation() {
  const [state, setState] = useState<EvaluationState>(INITIAL_STATE)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopLoadingMessages = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
  }, [])

  const startLoadingMessages = useCallback(() => {
    let index = 0
    loadingIntervalRef.current = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length
      setState((prev) => ({
        ...prev,
        loadingMessage: LOADING_MESSAGES[index],
      }))
    }, 2500)
  }, [])

  const evaluate = useCallback(
    async (situation: string) => {
      // Abort any in-flight request
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setState({
        ...INITIAL_STATE,
        status: 'loading',
        loadingMessage: LOADING_MESSAGES[0],
      })
      startLoadingMessages()

      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
        const response = await fetch(`${basePath}/api/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          const message =
            (data as { error?: string } | null)?.error ??
            'Something went wrong. Please try again.'
          stopLoadingMessages()
          setState((prev) => ({ ...prev, status: 'error', error: message }))
          return
        }

        if (!response.body) {
          stopLoadingMessages()
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: 'No response stream available.',
          }))
          return
        }

        // Switch to streaming state
        stopLoadingMessages()
        setState((prev) => ({ ...prev, status: 'streaming' }))

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        const push = createSSEReader((event) =>
          setState((prev) => applyEvent(prev, event))
        )

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          push(decoder.decode(value, { stream: true }))
        }

        // The stream ended without a final event (timeout, dropped connection)
        setState((prev) =>
          prev.status === 'streaming'
            ? {
                ...prev,
                status: 'error',
                error: 'Connection lost. Please try again.',
              }
            : prev
        )
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // Request was cancelled — no error state needed
          return
        }
        stopLoadingMessages()
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Connection lost. Please try again.',
        }))
      }
    },
    [startLoadingMessages, stopLoadingMessages]
  )

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    stopLoadingMessages()
    setState(INITIAL_STATE)
  }, [stopLoadingMessages])

  return { state, evaluate, reset }
}

function applyEvent(prev: EvaluationState, event: SSEEvent): EvaluationState {
  switch (event.type) {
    case 'chaos_rating':
      return { ...prev, chaosData: event.data }
    case 'timeline_entry':
      return { ...prev, timelineEntries: [...prev.timelineEntries, event.data] }
    case 'breaking_point':
      return { ...prev, breakingPoint: event.data.breakingPoint }
    case 'resignation':
      return { ...prev, ...event.data }
    case 'real_talk':
      return { ...prev, realTalkInsight: event.data.insight }
    case 'complete':
      return { ...prev, status: 'complete', resultId: event.data.id }
    case 'error':
      return { ...prev, status: 'error', error: event.data.message }
  }
}
