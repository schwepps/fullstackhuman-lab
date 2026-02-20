'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { changePasswordAction } from '@/lib/auth/account-actions'
import { AUTH_SUCCESS } from '@/lib/auth/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountErrorAlert } from '@/components/account/account-error-alert'
import { SubmitButton } from '@/components/auth/submit-button'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_PATTERN_HTML,
} from '@/lib/auth/schemas'

export function ChangePasswordForm() {
  const t = useTranslations('account')
  const [passwordState, passwordAction] = useActionState(
    changePasswordAction,
    null
  )

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('changePassword.title')}
      </h2>

      {passwordState?.success === AUTH_SUCCESS.PASSWORD_CHANGED && (
        <Alert>
          <AlertDescription>{t('changePassword.success')}</AlertDescription>
        </Alert>
      )}

      <AccountErrorAlert error={passwordState?.error} />

      <form action={passwordAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            {t('changePassword.currentPassword')}
          </Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('changePassword.newPassword')}</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            pattern={PASSWORD_PATTERN_HTML}
            title={t('changePassword.passwordHint', {
              minLength: PASSWORD_MIN_LENGTH,
            })}
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t('changePassword.confirmPassword')}
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
            title={t('changePassword.passwordHint', {
              minLength: PASSWORD_MIN_LENGTH,
            })}
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>
        <SubmitButton
          label={t('changePassword.submit')}
          loadingLabel={t('changePassword.submitting')}
        />
      </form>
    </section>
  )
}
