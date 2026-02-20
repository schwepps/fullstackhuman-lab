import type { User } from '@supabase/supabase-js'

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Derive a display name from a Supabase User object.
 * Priority: display_name -> full_name -> email prefix -> null.
 *
 * This is a pure function safe for both server and client components.
 * Server-only auth helpers live in lib/auth/helpers.ts.
 */
export function getDisplayName(user: User | null | undefined): string | null {
  if (!user) return null
  return (
    asString(user.user_metadata?.display_name) ??
    asString(user.user_metadata?.full_name) ??
    user.email?.split('@')[0] ??
    null
  )
}
