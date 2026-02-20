import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export { getDisplayName } from './display-name'

export type AuthResult =
  | { user: User; isAuthenticated: true }
  | { user: null; isAuthenticated: false }

/**
 * Non-throwing auth check. Returns user or null.
 * Used in routes that serve both anonymous and authenticated users (e.g., /api/chat).
 */
export async function getOptionalAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
    ? { user, isAuthenticated: true }
    : { user: null, isAuthenticated: false }
}
