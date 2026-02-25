'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CHAT_PATH } from '@/lib/constants/app'
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
    return { error: AUTH_ERROR.VALIDATION }
  }

  // Use configured site URL to ensure confirmation email redirects to the correct domain
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return { error: AUTH_ERROR.SIGNUP_FAILED }
  }

  const supabase = await createClient()
  // Profile row is created automatically by the handle_new_user() database trigger.
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/callback`,
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

  // Use configured site URL instead of Origin header to prevent open redirect
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return { error: AUTH_ERROR.RESET_FAILED }
  }
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/api/auth/callback?type=recovery`,
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
