'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { signupAction } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthErrorAlert } from '@/components/auth/auth-error-alert'
import { GoogleButton } from '@/components/auth/google-button'
import { OAuthDivider } from '@/components/auth/oauth-divider'
import { SubmitButton } from '@/components/auth/submit-button'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_PATTERN_HTML,
  DISPLAY_NAME_MAX_LENGTH,
} from '@/lib/auth/schemas'

type SignupFieldErrorKey =
  | 'signup.fieldErrors.displayName'
  | 'signup.fieldErrors.email'
  | 'signup.fieldErrors.password'

export default function SignupPage() {
  const t = useTranslations('auth')

  const [state, formAction] = useActionState(signupAction, null)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="terminal-text-glow text-2xl font-bold tracking-tight text-foreground">
          {t('signup.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('signup.subtitle')}</p>
      </div>

      <AuthErrorAlert error={state?.error} />

      <GoogleButton
        label={t('signup.google')}
        errorLabel={t('errors.generic')}
      />

      <OAuthDivider>{t('divider')}</OAuthDivider>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">{t('signup.displayName')}</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            aria-invalid={!!state?.fieldErrors?.displayName}
            aria-describedby={
              state?.fieldErrors?.displayName ? 'displayName-error' : undefined
            }
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
          {state?.fieldErrors?.displayName && (
            <p id="displayName-error" className="text-xs text-destructive">
              {t(state.fieldErrors.displayName as SignupFieldErrorKey)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('signup.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!state?.fieldErrors?.email}
            aria-describedby={
              state?.fieldErrors?.email ? 'email-error' : undefined
            }
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
          {state?.fieldErrors?.email && (
            <p id="email-error" className="text-xs text-destructive">
              {t(state.fieldErrors.email as SignupFieldErrorKey)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('signup.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            pattern={PASSWORD_PATTERN_HTML}
            title={t('signup.passwordHint', { minLength: PASSWORD_MIN_LENGTH })}
            aria-invalid={!!state?.fieldErrors?.password}
            aria-describedby={
              state?.fieldErrors?.password ? 'password-error' : 'password-hint'
            }
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
          {state?.fieldErrors?.password ? (
            <p id="password-error" className="text-xs text-destructive">
              {t(state.fieldErrors.password as SignupFieldErrorKey, {
                minLength: PASSWORD_MIN_LENGTH,
              })}
            </p>
          ) : (
            <p id="password-hint" className="text-xs text-muted-foreground">
              {t('signup.passwordHint', { minLength: PASSWORD_MIN_LENGTH })}
            </p>
          )}
        </div>

        <SubmitButton
          label={t('signup.submit')}
          loadingLabel={t('signup.submitting')}
        />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('signup.hasAccount')}{' '}
        <Link href="/auth/login" className="text-primary hover:text-primary/80">
          {t('signup.loginLink')}
        </Link>
      </p>
    </div>
  )
}
