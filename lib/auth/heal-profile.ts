import { createServiceClient } from '@/lib/supabase/service'
import { asString } from '@/lib/auth/display-name'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'

/**
 * Self-healing: recreate a missing public.users profile row.
 *
 * This handles the edge case where auth.users exists but public.users doesn't
 * (e.g., the on_auth_user_created trigger didn't fire because OAuth signed in
 * an existing auth user, or the profile row was manually deleted).
 *
 * Uses ON CONFLICT DO NOTHING for idempotency — safe to call even if the
 * profile already exists (e.g., from a concurrent request).
 *
 * NOT a server action — only called server-side from rate-limiter.ts.
 */
export async function healMissingProfile(userId: string): Promise<boolean> {
  const serviceClient = createServiceClient()

  // Fetch auth user metadata to populate the profile
  const { data: authUser, error: authError } =
    await serviceClient.auth.admin.getUserById(userId)

  if (authError || !authUser?.user) {
    log('error', LOG_EVENT.PROFILE_HEAL_FAILED, {
      userId,
      reason: 'auth_user_not_found',
    })
    return false
  }

  const user = authUser.user
  const meta = user.user_metadata ?? {}
  const avatarUrl = asString(meta.avatar_url)

  const { error: insertError } = await serviceClient.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      display_name:
        asString(meta.display_name) ?? asString(meta.full_name) ?? null,
      avatar_url:
        avatarUrl && /^https:\/\//i.test(avatarUrl) ? avatarUrl : null,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  if (insertError) {
    log('error', LOG_EVENT.PROFILE_HEAL_FAILED, {
      userId,
      reason: 'insert_failed',
      errorCode: insertError.code,
    })
    return false
  }

  log('warn', LOG_EVENT.PROFILE_HEALED, { userId })
  return true
}
