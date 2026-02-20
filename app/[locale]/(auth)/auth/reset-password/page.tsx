'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { resetPasswordAction } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthErrorAlert } from '@/components/auth/auth-error-alert'
import { SubmitButton } from '@/components/auth/submit-button'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_PATTERN_HTML,
} from '@/lib/auth/schemas'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')

  const [state, formAction] = useActionState(resetPasswordAction, null)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="terminal-text-glow text-2xl font-bold tracking-tight text-foreground">
          {t('resetPassword.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('resetPassword.subtitle')}
        </p>
      </div>

      <AuthErrorAlert error={state?.error} />

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t('resetPassword.password')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            pattern={PASSWORD_PATTERN_HTML}
            title={t('resetPassword.passwordHint', {
              minLength: PASSWORD_MIN_LENGTH,
            })}
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t('resetPassword.confirmPassword')}
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            pattern={PASSWORD_PATTERN_HTML}
            title={t('resetPassword.passwordHint', {
              minLength: PASSWORD_MIN_LENGTH,
            })}
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>

        <SubmitButton
          label={t('resetPassword.submit')}
          loadingLabel={t('resetPassword.submitting')}
        />
      </form>
    </div>
  )
}
