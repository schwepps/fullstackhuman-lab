import { NextRequest, NextResponse } from 'next/server'
import { hasLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

/**
 * Handles OAuth callbacks and password recovery redirects.
 * Supabase redirects here after:
 * - Google OAuth login/signup
 * - Password recovery email link click
 *
 * Profile creation is handled by the handle_new_user() database trigger
 * on auth.users INSERT — no manual insert needed here.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')

  // Validate locale from cookie against allowed list
  const rawLocale = request.cookies.get('NEXT_LOCALE')?.value
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale
  const localePath = locale === routing.defaultLocale ? '' : `/${locale}`

  if (error) {
    return NextResponse.redirect(
      new URL(`${localePath}/auth/login?error=auth`, origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${localePath}/auth/login?error=no_code`, origin)
    )
  }

  const supabase = await createClient()
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`${localePath}/auth/login?error=auth`, origin)
    )
  }

  // Password recovery: redirect to reset password page
  if (type === 'recovery') {
    return NextResponse.redirect(
      new URL(`${localePath}/auth/reset-password`, origin)
    )
  }

  return NextResponse.redirect(new URL(`${localePath}/chat`, origin))
}
