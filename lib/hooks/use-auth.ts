'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!cancelled) {
          setUser(user)
          setIsLoading(false)
        }
      })
      .catch(() => {
        // Ignore fetch abort from strict mode double-mount
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading }),
    [user, isLoading]
  )
}
