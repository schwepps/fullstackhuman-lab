'use client'

import { useState, useEffect, useCallback } from 'react'
import { TIER_QUOTAS } from '@/lib/constants/quotas'
import type { QuotaInfo } from '@/types/user'

interface QuotaState extends QuotaInfo {
  isLoading: boolean
}

const INITIAL_STATE: QuotaState = {
  remaining: TIER_QUOTAS.anonymous.maxConversationsPerDay,
  limit: TIER_QUOTAS.anonymous.maxConversationsPerDay,
  tier: 'anonymous',
  period: 'day',
  isLoading: true,
}

async function fetchQuota(): Promise<QuotaInfo> {
  const response = await fetch('/api/chat/quota')
  if (!response.ok) {
    throw new Error('Failed to fetch quota')
  }
  return response.json() as Promise<QuotaInfo>
}

export function useQuota() {
  const [state, setState] = useState<QuotaState>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false
    fetchQuota()
      .then((data) => {
        if (!cancelled) {
          setState({ ...data, isLoading: false })
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Optimistic: allow conversations when quota endpoint is unreachable.
          // Server-side rate limiter still enforces limits.
          setState({ ...INITIAL_STATE, isLoading: false })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refetch = useCallback(async () => {
    try {
      const data = await fetchQuota()
      setState({ ...data, isLoading: false })
    } catch {
      // Keep current state on refetch failure
    }
  }, [])

  return { ...state, refetch }
}
