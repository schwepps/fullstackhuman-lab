import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

const PROTECTED_PREFIXES = ['/account', '/conversations']

// Build locale prefix regex dynamically from routing config
const localePattern = routing.locales
  .filter((l) => l !== routing.defaultLocale)
  .join('|')
const localePrefixRegex = localePattern
  ? new RegExp(`^/(${localePattern})`)
  : null

function stripLocalePrefix(pathname: string): string {
  if (!localePrefixRegex) return pathname
  return pathname.replace(localePrefixRegex, '') || '/'
}

function isProtectedRoute(pathname: string): boolean {
  const pathWithoutLocale = stripLocalePrefix(pathname)
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix || pathWithoutLocale.startsWith(prefix + '/')
  )
}

export default async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session (must happen on every request)
  const { supabaseResponse, user } = await updateSession(request)

  // 2. Redirect protected routes to login if unauthenticated
  const { pathname } = request.nextUrl
  if (isProtectedRoute(pathname) && !user) {
    const hasLocalePrefix = localePrefixRegex?.test(pathname)
    const locale = hasLocalePrefix
      ? (pathname.match(localePrefixRegex!)?.[1] ?? routing.defaultLocale)
      : routing.defaultLocale
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
    const loginPath = `${prefix}/auth/login`
    const loginUrl = new URL(loginPath, request.url)

    // Validate redirect path: must be a relative path, no protocol-relative URLs
    if (
      pathname.startsWith('/') &&
      !pathname.startsWith('//') &&
      !pathname.includes('://')
    ) {
      loginUrl.searchParams.set('redirect', pathname)
    }

    const redirectResponse = NextResponse.redirect(loginUrl)
    // Transfer Supabase session cookies (including security attributes) to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // 3. Run next-intl locale detection
  const intlResponse = intlMiddleware(request)

  // 4. Merge Supabase session cookies (including security attributes) onto intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie)
  })

  return intlResponse
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
