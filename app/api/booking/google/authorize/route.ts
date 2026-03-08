import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { checkIsAdmin } from '@/lib/auth/check-admin'
import { getAuthorizationUrl } from '@/lib/booking/google-calendar'

/**
 * Admin-only: returns the Google OAuth consent URL.
 * Generates a CSRF state parameter stored in an httpOnly cookie.
 */
export async function GET() {
  const { isAdmin } = await checkIsAdmin()

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const state = randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const url = getAuthorizationUrl(state)
  return NextResponse.json({ url })
}
