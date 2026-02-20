'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  ChatMessage,
  ChatState,
  PersonaId,
  MessageRole,
} from '@/types/chat'
import { PERSONAS } from '@/lib/constants/personas'
import { readSSEStream } from '@/lib/ai/sse-reader'

function createMessage(
  role: MessageRole,
  content: string,
  isReport = false
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    isReport,
    timestamp: Date.now(),
  }
}

function buildApiMessages(
  messages: ChatMessage[],
  userMessage: ChatMessage,
  triggerText: string
) {
  return [
    { role: 'user' as const, content: triggerText },
    ...[...messages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ]
}

function detectReport(content: string, persona: PersonaId): boolean {
  return PERSONAS[persona].reportDetectPattern.test(content)
}

const INITIAL_STATE: ChatState = {
  phase: 'selection',
  persona: null,
  messages: [],
  isStreaming: false,
  error: null,
}

export function useChat() {
  const [state, setState] = useState<ChatState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const triggerRef = useRef('')

  const selectPersona = useCallback(
    (personaId: PersonaId, openingText: string, triggerText: string) => {
      triggerRef.current = triggerText
      const opening = createMessage('assistant', openingText)
      setState({
        phase: 'chatting',
        persona: personaId,
        messages: [opening],
        isStreaming: false,
        error: null,
      })
    },
    []
  )

  const sendMessage = useCallback(async (content: string) => {
    const { persona, isStreaming, messages } = stateRef.current
    if (!persona || isStreaming) return

    const userMsg = createMessage('user', content)
    const apiMessages = buildApiMessages(messages, userMsg, triggerRef.current)
    const assistantId = crypto.randomUUID()

    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        userMsg,
        {
          id: assistantId,
          role: 'assistant' as const,
          content: '',
          isReport: false,
          timestamp: Date.now(),
        },
      ],
      isStreaming: true,
      error: null,
    }))

    try {
      abortRef.current = new AbortController()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, messages: apiMessages }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        let errorCode = 'generic_error'
        try {
          const err = (await response.json()) as { error: string }
          if (err.error === 'rate_limit_exceeded') {
            errorCode = 'rate_limit_exceeded'
          }
        } catch {
          // Non-JSON error response (e.g., proxy 502)
        }
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          messages: prev.messages.filter((m) => m.id !== assistantId),
          error: errorCode,
        }))
        return
      }

      let accumulated = ''
      for await (const event of readSSEStream(response)) {
        if (event.error) {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: 'stream_error',
          }))
          return
        }
        if (event.text) {
          accumulated += event.text
          const current = accumulated
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantId ? { ...m, content: current } : m
            ),
          }))
        }
      }

      const isReport = detectReport(accumulated, persona)
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        messages: prev.messages.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated, isReport } : m
        ),
      }))
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setState((prev) => ({ ...prev, isStreaming: false }))
        return
      }
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: 'generic_error',
      }))
    }
  }, [])

  const resetChat = useCallback(() => {
    abortRef.current?.abort()
    setState(INITIAL_STATE)
  }, [])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const dismissError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    selectPersona,
    sendMessage,
    resetChat,
    stopStreaming,
    dismissError,
  }
}
