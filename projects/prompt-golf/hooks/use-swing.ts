'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import type {
  SwingResult,
  StageStatus,
  ScoreResult,
  JudgeTestResult,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StageState {
  name: string
  status: StageStatus
}

export type SwingStatus =
  | 'idle'
  | 'sending'
  | 'streaming'
  | 'pass'
  | 'fail'
  | 'error'

export interface SwingState {
  status: SwingStatus
  stages: StageState[]
  codeTokens: string
  code: string | null
  wordCount: number | null
  verdict: {
    pass: boolean
    testResults: JudgeTestResult[]
    summary: string
  } | null
  score: ScoreResult | null
  analysis: { summary: string; detail: string } | null
  error: string | null
}

const INITIAL_STATE: SwingState = {
  status: 'idle',
  stages: [],
  codeTokens: '',
  code: null,
  wordCount: null,
  verdict: null,
  score: null,
  analysis: null,
  error: null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSwing() {
  const [state, setState] = useState<SwingState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)

  const sendSwing = useCallback(
    async (
      challengeId: string,
      prompt: string,
      sessionId: string,
      isPractice: boolean,
      isMulligan: boolean
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({ ...INITIAL_STATE, status: 'sending' })

      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
        const response = await fetch(`${basePath}/api/swing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId,
            prompt,
            sessionId,
            isPractice,
            isMulligan,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          const message =
            (data as { error?: string } | null)?.error ??
            'Something went wrong on the course.'
          setState((prev) => ({ ...prev, status: 'error', error: message }))
          return
        }

        if (!response.body) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: 'No response stream. Please try again.',
          }))
          return
        }

        setState((prev) => ({ ...prev, status: 'streaming' }))

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
          error: 'Lost connection. Please try again.',
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

  return useMemo(() => ({ state, sendSwing, reset }), [state, sendSwing, reset])
}

// ---------------------------------------------------------------------------
// SSE event handler
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function handleSSEEvent(
  type: string,
  data: unknown,
  setState: React.Dispatch<React.SetStateAction<SwingState>>
) {
  if (!isRecord(data)) return

  switch (type) {
    case 'stage_update': {
      if (typeof data.stage !== 'string' || typeof data.status !== 'string')
        return
      setState((prev) => {
        const existing = prev.stages.findIndex(
          (s) => s.name === (data.stage as string)
        )
        const stageState: StageState = {
          name: data.stage as string,
          status: data.status as StageStatus,
        }
        const stages =
          existing >= 0
            ? prev.stages.map((s, i) => (i === existing ? stageState : s))
            : [...prev.stages, stageState]
        return { ...prev, stages }
      })
      break
    }

    case 'validation': {
      if (typeof data.wordCount === 'number') {
        setState((prev) => ({
          ...prev,
          wordCount: data.wordCount as number,
        }))
      }
      if (data.isValid === false && typeof data.reason === 'string') {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: data.reason as string,
        }))
      }
      break
    }

    case 'code_token': {
      if (typeof data.text !== 'string') return
      setState((prev) => ({
        ...prev,
        codeTokens: prev.codeTokens + (data.text as string),
      }))
      break
    }

    case 'code_complete': {
      if (typeof data.code === 'string') {
        setState((prev) => ({
          ...prev,
          code: data.code as string,
        }))
      }
      break
    }

    case 'judge_verdict': {
      setState((prev) => ({
        ...prev,
        verdict: {
          pass: Boolean((data as Record<string, unknown>).pass),
          testResults: Array.isArray(
            (data as Record<string, unknown>).testResults
          )
            ? ((data as Record<string, unknown>)
                .testResults as JudgeTestResult[])
            : [],
          summary: String((data as Record<string, unknown>).summary ?? ''),
        },
      }))
      break
    }

    case 'analysis': {
      setState((prev) => ({
        ...prev,
        analysis: {
          summary: String((data as Record<string, unknown>).summary ?? ''),
          detail: String((data as Record<string, unknown>).detail ?? ''),
        },
      }))
      break
    }

    case 'result': {
      const result = data as unknown as SwingResult
      setState((prev) => ({
        ...prev,
        status: result.verdict?.pass ? 'pass' : 'fail',
        score: result.score ?? prev.score,
        analysis: result.analysis ?? prev.analysis,
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
