'use client'

import { useState, useEffect } from 'react'
import { MAX_CONVERSATIONS_PER_DAY } from '@/lib/constants/chat'

interface QuotaState {
  remaining: number
  limit: number
  isLoading: boolean
}

const INITIAL_STATE: QuotaState = {
  remaining: MAX_CONVERSATIONS_PER_DAY,
  limit: MAX_CONVERSATIONS_PER_DAY,
  isLoading: true,
}

async function fetchQuota(): Promise<{ remaining: number; limit: number }> {
  const response = await fetch('/api/chat/quota')
  if (!response.ok) {
    throw new Error('Failed to fetch quota')
  }
  return response.json() as Promise<{ remaining: number; limit: number }>
}

export function useQuota() {
  const [state, setState] = useState<QuotaState>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false
    fetchQuota()
      .then((data) => {
        if (!cancelled) {
          setState({
            remaining: data.remaining,
            limit: data.limit,
            isLoading: false,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Optimistic: allow conversations when quota endpoint is unreachable.
          // Server-side rate limiter still enforces limits.
          setState({
            remaining: MAX_CONVERSATIONS_PER_DAY,
            limit: MAX_CONVERSATIONS_PER_DAY,
            isLoading: false,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function refetch() {
    try {
      const data = await fetchQuota()
      setState({
        remaining: data.remaining,
        limit: data.limit,
        isLoading: false,
      })
    } catch {
      // Keep current state on refetch failure
    }
  }

  return { ...state, refetch }
}
