'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { APP_URL, CHAT_PATH } from '@/lib/constants/app'
import { AUTH_ERROR, AUTH_SUCCESS, type AuthActionState } from './types'
import { checkAuthRateLimit } from './rate-limit'

import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas'

export async function loginAction(
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

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: AUTH_ERROR.INVALID_CREDENTIALS }
  }

  revalidatePath('/', 'layout')

  // Redirect to the original destination if provided, otherwise default to /chat
  const redirectPath = formData.get('redirect')
  if (
    typeof redirectPath === 'string' &&
    redirectPath.startsWith('/') &&
    !redirectPath.startsWith('//') &&
    !redirectPath.includes('://')
  ) {
    redirect(redirectPath)
  }
  redirect(CHAT_PATH)
}

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit())) {
    return { error: AUTH_ERROR.RATE_LIMITED }
  }

  const raw = {
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      if (!issue.path[0]) continue
      const field = String(issue.path[0])
      if (!fieldErrors[field]) {
        fieldErrors[field] = `signup.fieldErrors.${field}`
      }
    }
    return { error: AUTH_ERROR.VALIDATION, fieldErrors }
  }

  const supabase = await createClient()
  // Profile row is created automatically by the handle_new_user() database trigger.
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${APP_URL}/api/auth/callback`,
      data: {
        display_name: parsed.data.displayName,
      },
    },
  })

  if (error) {
    // Return generic error to prevent email enumeration.
    // Supabase error codes vary — do not expose specifics to the client.
    return { error: AUTH_ERROR.SIGNUP_FAILED }
  }

  revalidatePath('/', 'layout')
  redirect(CHAT_PATH)
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit())) {
    return { error: AUTH_ERROR.RATE_LIMITED }
  }

  const raw = {
    email: formData.get('email'),
  }

  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/api/auth/callback?type=recovery`,
  })

  // Always return success to prevent email enumeration
  return { success: AUTH_SUCCESS.SENT }
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit())) {
    return { error: AUTH_ERROR.RATE_LIMITED }
  }

  const raw = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    // Cross-field refine errors (code: 'custom') can't be caught by HTML validation
    const hasCrossField = parsed.error.issues.some(
      (issue) => issue.code === 'custom'
    )
    if (hasCrossField) {
      return { error: AUTH_ERROR.PASSWORDS_DONT_MATCH }
    }
    return { error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()

  // Verify the caller has a valid recovery session (defense-in-depth)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: AUTH_ERROR.UNAUTHORIZED }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: AUTH_ERROR.RESET_FAILED }
  }

  await supabase.auth.signOut()
  redirect('/auth/login?reset=success')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
