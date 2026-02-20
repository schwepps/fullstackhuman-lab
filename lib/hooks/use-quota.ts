'use client'

import { useState, useEffect } from 'react'

interface QuotaState {
  remaining: number
  limit: number
  isLoading: boolean
}

const INITIAL_STATE: QuotaState = {
  remaining: 0,
  limit: 0,
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
          setState((prev) => ({ ...prev, isLoading: false }))
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
