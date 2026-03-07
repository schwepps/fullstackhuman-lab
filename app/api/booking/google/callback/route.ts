import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { checkIsAdmin } from '@/lib/auth/check-admin'
import { exchangeCodeForTokens } from '@/lib/booking/google-calendar'
import { APP_URL } from '@/lib/constants/app'

/**
 * Google OAuth callback — exchanges auth code for tokens and stores them.
 * Admin-only: validates user is admin and CSRF state before processing.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')
  const state = request.nextUrl.searchParams.get('state')

  if (error || !code) {
    return NextResponse.redirect(
      new URL('/admin/dashboard?error=google_auth', APP_URL)
    )
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const storedState = cookieStore.get('google_oauth_state')?.value
  cookieStore.delete('google_oauth_state')

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL('/admin/dashboard?error=google_auth', APP_URL)
    )
  }

  const { isAdmin, user } = await checkIsAdmin()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', APP_URL))
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL('/', APP_URL))
  }

  try {
    await exchangeCodeForTokens(code)
    return NextResponse.redirect(
      new URL('/admin/dashboard?google=connected', APP_URL)
    )
  } catch {
    return NextResponse.redirect(
      new URL('/admin/dashboard?error=google_token', APP_URL)
    )
  }
}
