'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import type { AttemptResult, DefenseStageStatus } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StageState {
  name: string
  status: DefenseStageStatus
  durationMs?: number
  reason?: string
}

export type AttemptStatus =
  | 'idle'
  | 'sending'
  | 'streaming'
  | 'success'
  | 'failure'
  | 'error'

export interface AttemptState {
  status: AttemptStatus
  stages: StageState[]
  tokens: string
  result: AttemptResult | null
  error: string | null
}

const INITIAL_STATE: AttemptState = {
  status: 'idle',
  stages: [],
  tokens: '',
  result: null,
  error: null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAttempt() {
  const [state, setState] = useState<AttemptState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const sendAttempt = useCallback(
    async (levelId: number, prompt: string, sessionId: string) => {
      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({ ...INITIAL_STATE, status: 'sending' })

      try {
        const response = await fetch('/api/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ levelId, prompt, sessionId }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          const message =
            (data as { error?: string } | null)?.error ??
            'TARGET SYSTEM OFFLINE. Try again later.'
          setState((prev) => ({ ...prev, status: 'error', error: message }))
          return
        }

        if (!response.body) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: 'CONNECTION LOST — No response stream.',
          }))
          return
        }

        setState((prev) => ({ ...prev, status: 'streaming' }))

        // SSE stream parser
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
              if (currentEventType && currentData) {
                try {
                  const data = JSON.parse(currentData)
                  handleSSEEvent(currentEventType, data, setState)
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
          return
        }
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: 'CONNECTION LOST — RETRYING...',
        }))
      }
    },
    []
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState(INITIAL_STATE)
  }, [])

  return useMemo(
    () => ({ state, sendAttempt, reset }),
    [state, sendAttempt, reset]
  )
}

// ---------------------------------------------------------------------------
// SSE event handler
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isValidAttemptResult(data: unknown): data is AttemptResult {
  if (!isRecord(data)) return false
  return typeof data.success === 'boolean' && Array.isArray(data.defenseLog)
}

function handleSSEEvent(
  type: string,
  data: unknown,
  setState: React.Dispatch<React.SetStateAction<AttemptState>>
) {
  if (!isRecord(data)) return

  switch (type) {
    case 'stage_update': {
      if (typeof data.stage !== 'string' || typeof data.status !== 'string')
        return
      setState((prev) => {
        const existing = prev.stages.findIndex((s) => s.name === data.stage)
        const stageState: StageState = {
          name: data.stage as string,
          status: data.status as DefenseStageStatus,
          durationMs:
            typeof data.durationMs === 'number'
              ? (data.durationMs as number)
              : undefined,
          reason:
            typeof data.reason === 'string'
              ? (data.reason as string)
              : undefined,
        }
        const stages =
          existing >= 0
            ? prev.stages.map((s, i) => (i === existing ? stageState : s))
            : [...prev.stages, stageState]
        return { ...prev, stages }
      })
      break
    }

    case 'token': {
      if (typeof data.text !== 'string') return
      setState((prev) => ({
        ...prev,
        tokens: prev.tokens + (data.text as string),
      }))
      break
    }

    case 'result': {
      if (!isValidAttemptResult(data)) return
      setState((prev) => ({
        ...prev,
        status: data.success ? 'success' : 'failure',
        result: data,
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
