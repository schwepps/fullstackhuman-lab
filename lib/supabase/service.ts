import { createClient } from '@supabase/supabase-js'

/**
 * Service role client that bypasses RLS.
 * Use ONLY server-side for admin operations (e.g., account deletion).
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  )
}
