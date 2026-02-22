'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  ANONYMOUS_CONVERSATIONS_KEY,
  MAX_ANONYMOUS_CONVERSATIONS,
} from '@/lib/constants/conversations'
import type { PersonaId, ChatMessage } from '@/types/chat'
import type { ConversationStatus } from '@/types/conversation'

export interface AnonymousConversation {
  readonly id: string
  readonly persona: PersonaId
  readonly title: string | null
  readonly messages: ChatMessage[]
  readonly hasReport: boolean
  readonly status: ConversationStatus
  readonly createdAt: number
  readonly updatedAt: number
}

function readFromStorage(): AnonymousConversation[] {
  try {
    const raw = localStorage.getItem(ANONYMOUS_CONVERSATIONS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as AnonymousConversation[]
  } catch {
    return []
  }
}

function writeToStorage(conversations: AnonymousConversation[]): void {
  try {
    localStorage.setItem(
      ANONYMOUS_CONVERSATIONS_KEY,
      JSON.stringify(conversations)
    )
  } catch {
    // localStorage unavailable or full — fail silently
  }
}

export function useAnonymousConversations() {
  const [conversations, setConversations] =
    useState<AnonymousConversation[]>(readFromStorage)

  const save = useCallback((conversation: AnonymousConversation) => {
    setConversations((prev) => {
      const existing = prev.findIndex((c) => c.id === conversation.id)
      let updated: AnonymousConversation[]

      if (existing >= 0) {
        updated = prev.map((c, i) => (i === existing ? conversation : c))
      } else {
        updated = [conversation, ...prev]
      }

      // Cap at max, remove oldest
      if (updated.length > MAX_ANONYMOUS_CONVERSATIONS) {
        updated = updated.slice(0, MAX_ANONYMOUS_CONVERSATIONS)
      }

      writeToStorage(updated)
      return updated
    })
  }, [])

  const remove = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const clear = useCallback(() => {
    setConversations([])
    try {
      localStorage.removeItem(ANONYMOUS_CONVERSATIONS_KEY)
    } catch {
      // Fail silently
    }
  }, [])

  return useMemo(
    () => ({ conversations, save, remove, clear }),
    [conversations, save, remove, clear]
  )
}
