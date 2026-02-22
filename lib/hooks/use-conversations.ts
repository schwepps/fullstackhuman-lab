'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { RECENT_CONVERSATIONS_LIMIT } from '@/lib/constants/conversations'
import type { ConversationSummary } from '@/types/conversation'

interface UseConversationsOptions {
  limit?: number
}

export function useConversations(options?: UseConversationsOptions) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = options?.limit ?? RECENT_CONVERSATIONS_LIMIT

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations?limit=${limit}`)
      if (!response.ok) {
        setError('fetch_failed')
        setConversations([])
        return
      }
      const data = (await response.json()) as ConversationSummary[]
      setConversations(data)
    } catch {
      setError('fetch_failed')
      setConversations([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, limit])

  useEffect(() => {
    if (!authLoading) {
      fetchConversations()
    }
  }, [authLoading, fetchConversations])

  const refetch = useCallback(() => {
    fetchConversations()
  }, [fetchConversations])

  return useMemo(
    () => ({
      conversations,
      isLoading: authLoading || isLoading,
      error,
      refetch,
    }),
    [conversations, authLoading, isLoading, error, refetch]
  )
}
