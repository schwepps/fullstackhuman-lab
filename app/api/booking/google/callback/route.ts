import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/booking/google-calendar'
import { APP_URL } from '@/lib/constants/app'

/**
 * Google OAuth callback — exchanges auth code for tokens and stores them.
 * Admin-only: validates user is admin before processing.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL('/admin/dashboard?error=google_auth', APP_URL)
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', APP_URL))
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
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
