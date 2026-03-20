'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { BASE_PATH } from '@/lib/constants'
import type { EvidenceType } from '@/lib/types'

type StreamStatus = 'idle' | 'streaming' | 'complete' | 'error'

interface EvidenceStreamState {
  status: StreamStatus
  evidence: string
  wordCount: number | null
  error: string | null
}

export function useEvidenceStream() {
  const [state, setState] = useState<EvidenceStreamState>({
    status: 'idle',
    evidence: '',
    wordCount: null,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const submitEvidence = useCallback(
    async (
      accuserId: string,
      suspectId: string,
      prompt: string,
      evidenceType: EvidenceType
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({
        status: 'streaming',
        evidence: '',
        wordCount: null,
        error: null,
      })

      try {
        const res = await fetch(`${BASE_PATH}/api/prosecute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accuserId, suspectId, prompt, evidenceType }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const data = await res
            .json()
            .catch(() => ({ message: 'Request failed' }))
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: data.message ?? 'Request failed',
          }))
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              // Next line should be data
              const nextLine = lines[i + 1]
              if (nextLine?.startsWith('data: ')) {
                try {
                  const data = JSON.parse(nextLine.slice(6))
                  handleEvent(eventType, data, setState)
                } catch {
                  // Skip malformed event data
                }
                i++ // Skip the data line we just consumed
              }
            } else if (line.startsWith('data: ')) {
              // Standalone data line (not preceded by event:)
              try {
                const data = JSON.parse(line.slice(6))
                if (data.message) {
                  setState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: data.message,
                  }))
                }
              } catch {
                // Skip malformed
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: err instanceof Error ? err.message : 'Stream failed',
          }))
        }
      }
    },
    []
  )

  const submitDefense = useCallback(
    async (defenderId: string, prompt: string, redirectTo?: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({
        status: 'streaming',
        evidence: '',
        wordCount: null,
        error: null,
      })

      try {
        const res = await fetch(`${BASE_PATH}/api/defend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defenderId, prompt, redirectTo }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const data = await res
            .json()
            .catch(() => ({ message: 'Request failed' }))
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: data.message ?? 'Request failed',
          }))
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              const nextLine = lines[i + 1]
              if (nextLine?.startsWith('data: ')) {
                try {
                  const data = JSON.parse(nextLine.slice(6))
                  handleEvent(eventType, data, setState)
                } catch {
                  // Skip malformed
                }
                i++
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: err instanceof Error ? err.message : 'Stream failed',
          }))
        }
      }
    },
    []
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle', evidence: '', wordCount: null, error: null })
  }, [])

  return useMemo(
    () => ({ ...state, submitEvidence, submitDefense, reset }),
    [state, submitEvidence, submitDefense, reset]
  )
}

function handleEvent(
  eventType: string,
  data: Record<string, unknown>,
  setState: React.Dispatch<React.SetStateAction<EvidenceStreamState>>
) {
  switch (eventType) {
    case 'evidence_token':
      setState((prev) => ({
        ...prev,
        evidence: prev.evidence + (data.text as string),
      }))
      break
    case 'evidence_complete':
      setState((prev) => ({
        ...prev,
        evidence: data.evidence as string,
        wordCount: data.wordCount as number,
      }))
      break
    case 'result':
      setState((prev) => ({ ...prev, status: 'complete' }))
      break
    case 'error':
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: data.message as string,
      }))
      break
  }
}
