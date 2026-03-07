import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/booking/google-calendar'

/**
 * Admin-only: returns the Google OAuth consent URL.
 * User must be authenticated and have is_admin = true.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = getAuthorizationUrl()
  return NextResponse.json({ url })
}
