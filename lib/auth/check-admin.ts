'use server'

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

interface AdminCheckResult {
  isAdmin: boolean
  user: User | null
}

/**
 * Check if the current user is an admin.
 * Returns both the admin status and user object for convenience.
 */
export async function checkIsAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { isAdmin: false, user: null }

  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return { isAdmin: data?.is_admin ?? false, user }
}
