'use client'

import { Suspense, useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { loginAction } from '@/lib/auth/actions'
import { AUTH_ERROR } from '@/lib/auth/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GoogleButton } from '@/components/auth/google-button'
import { OAuthDivider } from '@/components/auth/oauth-divider'
import { SubmitButton } from '@/components/auth/submit-button'

function getLoginErrorMessage(
  oauthError: string | null,
  state: { error?: string } | null,
  t: ReturnType<typeof useTranslations>
): string | null {
  if (oauthError === 'auth') return t('errors.generic')
  if (state?.error === AUTH_ERROR.VALIDATION) return null
  if (state?.error === AUTH_ERROR.INVALID_CREDENTIALS)
    return t('errors.invalidCredentials')
  if (state?.error === AUTH_ERROR.RATE_LIMITED) return t('errors.rateLimited')
  if (state?.error) return t('errors.generic')
  return null
}

function LoginForm() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const resetSuccess = searchParams.get('reset') === 'success'
  const redirectTo = searchParams.get('redirect')

  const [state, formAction] = useActionState(loginAction, null)

  const errorMessage = getLoginErrorMessage(oauthError, state, t)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="terminal-text-glow text-2xl font-bold tracking-tight text-foreground">
          {t('login.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </div>

      {resetSuccess && (
        <Alert>
          <AlertDescription>{t('login.resetSuccess')}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <GoogleButton
        label={t('login.google')}
        errorLabel={t('errors.generic')}
      />

      <OAuthDivider>{t('divider')}</OAuthDivider>

      <form action={formAction} className="space-y-4">
        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}
        <div className="space-y-2">
          <Label htmlFor="email">{t('login.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:text-primary/80"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>

        <SubmitButton
          label={t('login.submit')}
          loadingLabel={t('login.submitting')}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link
          href="/auth/signup"
          className="text-primary hover:text-primary/80"
        >
          {t('login.signupLink')}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
