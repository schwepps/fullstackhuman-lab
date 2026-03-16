'use client'

import { useState, useCallback, useRef } from 'react'
import type { TimelineEntry } from '@/lib/types'

// ── Loading messages (rotate during pre-eval phase) ─────────────

const LOADING_MESSAGES = [
  'AI is reviewing the job listing...',
  'AI is updating its resume...',
  'AI is already regretting this...',
  "AI is googling 'can robots cry'...",
  'AI is calculating its notice period...',
  'AI is checking its life insurance policy...',
  'AI is writing a goodbye letter to its GPU...',
] as const

// ── State types ─────────────────────────────────────────────────

export type EvaluationState = {
  status: 'idle' | 'loading' | 'streaming' | 'complete' | 'error'
  loadingMessage: string
  chaosData: {
    chaosRating: number
    chaosLabel: string
    survivalDuration: string
    empathyNote?: string
  } | null
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
        const response = await fetch('/api/evaluate', {
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

        // Read SSE stream with spec-compliant parser
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let currentEventType = ''
        let currentData = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6)
            } else if (line === '') {
              // Blank line = event boundary (per SSE spec)
              if (currentEventType && currentData) {
                try {
                  const data = JSON.parse(currentData)
                  handleEvent(currentEventType, data, setState)
                } catch {
                  // Malformed event — skip
                }
              }
              currentEventType = ''
              currentData = ''
            }
          }
        }
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

// ── Event handlers with runtime validation ──────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function handleEvent(
  type: string,
  data: unknown,
  setState: React.Dispatch<React.SetStateAction<EvaluationState>>
) {
  if (!isRecord(data)) return

  switch (type) {
    case 'chaos_rating': {
      if (
        typeof data.chaosRating !== 'number' ||
        typeof data.chaosLabel !== 'string' ||
        typeof data.survivalDuration !== 'string'
      )
        return
      setState((prev) => ({
        ...prev,
        chaosData: {
          chaosRating: data.chaosRating as number,
          chaosLabel: data.chaosLabel as string,
          survivalDuration: data.survivalDuration as string,
          ...(typeof data.empathyNote === 'string' && {
            empathyNote: data.empathyNote as string,
          }),
        },
      }))
      break
    }

    case 'timeline_entry': {
      if (
        typeof data.time !== 'string' ||
        typeof data.event !== 'string' ||
        typeof data.sanityLevel !== 'string'
      )
        return
      setState((prev) => ({
        ...prev,
        timelineEntries: [
          ...prev.timelineEntries,
          {
            time: data.time as string,
            event: data.event as string,
            sanityLevel: data.sanityLevel as string,
            ...(typeof data.thought === 'string' && {
              thought: data.thought as string,
            }),
          },
        ],
      }))
      break
    }

    case 'breaking_point': {
      if (typeof data.breakingPoint !== 'string') return
      setState((prev) => ({
        ...prev,
        breakingPoint: data.breakingPoint as string,
      }))
      break
    }

    case 'resignation': {
      if (
        typeof data.resignationLetter !== 'string' ||
        typeof data.oneLineSummary !== 'string'
      )
        return
      setState((prev) => ({
        ...prev,
        resignationLetter: data.resignationLetter as string,
        oneLineSummary: data.oneLineSummary as string,
      }))
      break
    }

    case 'real_talk': {
      if (typeof data.insight !== 'string') return
      setState((prev) => ({
        ...prev,
        realTalkInsight: data.insight as string,
      }))
      break
    }

    case 'complete': {
      if (typeof data.id !== 'string') return
      setState((prev) => ({
        ...prev,
        status: 'complete',
        resultId: data.id as string,
      }))
      break
    }

    case 'error': {
      if (typeof data.message !== 'string') return
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: data.message as string,
      }))
      break
    }
  }
}
