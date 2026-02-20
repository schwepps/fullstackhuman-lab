'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
} from './schemas'
import {
  AUTH_ERROR,
  AUTH_SUCCESS,
  type AuthActionState,
  type AuthErrorCode,
} from './types'
import { checkAuthRateLimit } from './rate-limit'

// Known limitation: verifying the current password via signInWithPassword()
// creates a new session token as a side effect. Supabase does not expose a
// dedicated re-authentication API, so we accept the session refresh trade-off.
// The old session is effectively replaced by the new one.

async function reauthenticate(
  supabase: SupabaseClient,
  password: string
): Promise<{ user: User; error: null } | { user: null; error: AuthErrorCode }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { user: null, error: AUTH_ERROR.UNAUTHORIZED }

  // Defense-in-depth: reject if user has no password identity (OAuth-only)
  const hasPasswordAuth =
    user.identities?.some((i) => i.provider === 'email') ?? false
  if (!hasPasswordAuth) return { user: null, error: AUTH_ERROR.UNAUTHORIZED }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (error) return { user: null, error: AUTH_ERROR.WRONG_PASSWORD }
  return { user, error: null }
}

export async function changePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit())) {
    return { error: AUTH_ERROR.RATE_LIMITED }
  }

  const raw = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = changePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    // Cross-field refine errors (code: 'custom') can't be caught by HTML validation
    const hasSamePassword = parsed.error.issues.some(
      (issue) => issue.code === 'custom' && issue.path.includes('newPassword')
    )
    if (hasSamePassword) {
      return { error: AUTH_ERROR.SAME_PASSWORD }
    }
    const hasPasswordsMismatch = parsed.error.issues.some(
      (issue) =>
        issue.code === 'custom' && issue.path.includes('confirmPassword')
    )
    if (hasPasswordsMismatch) {
      return { error: AUTH_ERROR.PASSWORDS_DONT_MATCH }
    }
    return { error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()
  const auth = await reauthenticate(supabase, parsed.data.currentPassword)
  if (auth.error) return { error: auth.error }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (error) {
    return { error: AUTH_ERROR.UPDATE_FAILED }
  }

  // Invalidate other sessions so a compromised session can't persist
  await supabase.auth.signOut({ scope: 'others' })

  return { success: AUTH_SUCCESS.PASSWORD_CHANGED }
}

export async function changeEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit())) {
    return { error: AUTH_ERROR.RATE_LIMITED }
  }

  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = changeEmailSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()
  const auth = await reauthenticate(supabase, parsed.data.password)
  if (auth.error) return { error: auth.error }

  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
  })

  if (error) {
    return { error: AUTH_ERROR.EMAIL_UPDATE_FAILED }
  }

  return { success: AUTH_SUCCESS.EMAIL_CONFIRMATION_SENT }
}

export async function deleteAccountAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit())) {
    return { error: AUTH_ERROR.RATE_LIMITED }
  }

  const raw = {
    password: formData.get('password'),
  }

  const parsed = deleteAccountSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()
  const auth = await reauthenticate(supabase, parsed.data.password)
  if (auth.error) return { error: auth.error }

  // Delete auth user via service client — CASCADE handles public.users row
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.auth.admin.deleteUser(auth.user.id)

  if (error) {
    return { error: AUTH_ERROR.DELETE_FAILED }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
