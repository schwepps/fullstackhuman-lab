'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import type {
  ChatMessage,
  ChatState,
  PersonaId,
  MessageRole,
} from '@/types/chat'
import type { Conversation } from '@/types/conversation'
import { PERSONAS } from '@/lib/constants/personas'
import { readSSEStream } from '@/lib/ai/sse-reader'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  createConversation,
  saveMessages,
  abandonConversation,
} from '@/lib/conversations/actions'
import {
  createReport,
  getShareTokenForConversation,
} from '@/lib/reports/actions'

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
  conversationId: null,
  isReadOnly: false,
  shareToken: null,
}

export function useChat() {
  const [state, setState] = useState<ChatState>(INITIAL_STATE)
  const { trackReportGenerated } = useAnalytics()
  const { isAuthenticated } = useAuth()
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
        conversationId: null,
        isReadOnly: false,
        shareToken: null,
      })
    },
    []
  )

  // Persist conversation after stream completion (fire and forget)
  const persistAfterStream = useCallback(
    async (persona: PersonaId, messages: ChatMessage[], isReport: boolean) => {
      if (!isAuthenticated) return

      let conversationId = stateRef.current.conversationId
      if (conversationId) {
        await saveMessages(conversationId, messages, isReport)
      } else {
        const result = await createConversation(persona, messages)
        if (result.success) {
          conversationId = result.id
          setState((prev) => ({ ...prev, conversationId: result.id }))
        }
      }

      // Create report row when a report is detected
      if (isReport && conversationId) {
        const reportContent =
          messages.findLast((m) => m.isReport)?.content ?? ''
        const reportResult = await createReport(
          conversationId,
          persona,
          reportContent
        )
        if (reportResult.success) {
          setState((prev) => ({
            ...prev,
            shareToken: reportResult.shareToken,
          }))
        }
      }
    },
    [isAuthenticated]
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const { persona, isStreaming, messages, isReadOnly } = stateRef.current
      if (!persona || isStreaming || isReadOnly) return

      const userMsg = createMessage('user', content)
      const apiMessages = buildApiMessages(
        messages,
        userMsg,
        triggerRef.current
      )
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
              // Remove empty assistant placeholder if no content was streamed
              messages: prev.messages.filter(
                (m) => m.id !== assistantId || m.content !== ''
              ),
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
        if (isReport) {
          trackReportGenerated({
            persona,
            message_count: stateRef.current.messages.length,
          })
        }
        // Compute updated messages for both state and persistence
        const updatedMessages = stateRef.current.messages.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated, isReport } : m
        )
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          messages: prev.messages.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated, isReport } : m
          ),
        }))
        // Persist after state update (fire and forget, don't block UI)
        void persistAfterStream(persona, updatedMessages, isReport).catch(
          () => {
            // Suppress unhandled promise rejection — persistence is best-effort
          }
        )
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            messages: prev.messages.filter(
              (m) => m.id !== assistantId || m.content !== ''
            ),
          }))
          return
        }
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: 'generic_error',
        }))
      }
    },
    [trackReportGenerated, persistAfterStream]
  )

  const resetChat = useCallback(() => {
    abortRef.current?.abort()
    const { conversationId } = stateRef.current
    const hasReport = stateRef.current.messages.some((m) => m.isReport)
    if (conversationId && !hasReport) {
      abandonConversation(conversationId)
    }
    setState(INITIAL_STATE)
  }, [])

  const loadConversation = useCallback(async (conversation: Conversation) => {
    setState({
      phase: 'chatting',
      persona: conversation.persona,
      messages: conversation.messages,
      isStreaming: false,
      error: null,
      conversationId: conversation.id,
      isReadOnly: true,
      shareToken: null,
    })

    // Load share token for conversations with reports
    if (conversation.hasReport) {
      const token = await getShareTokenForConversation(conversation.id)
      if (token) {
        setState((prev) => ({ ...prev, shareToken: token }))
      }
    }
  }, [])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const dismissError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return useMemo(
    () => ({
      ...state,
      selectPersona,
      sendMessage,
      resetChat,
      loadConversation,
      stopStreaming,
      dismissError,
    }),
    [
      state,
      selectPersona,
      sendMessage,
      resetChat,
      loadConversation,
      stopStreaming,
      dismissError,
    ]
  )
}
