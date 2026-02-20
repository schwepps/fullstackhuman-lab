'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { changeEmailAction } from '@/lib/auth/account-actions'
import { AUTH_SUCCESS } from '@/lib/auth/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountErrorAlert } from '@/components/account/account-error-alert'
import { SubmitButton } from '@/components/auth/submit-button'

export function ChangeEmailForm() {
  const t = useTranslations('account')
  const [emailState, emailAction] = useActionState(changeEmailAction, null)

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('changeEmail.title')}
      </h2>

      {emailState?.success === AUTH_SUCCESS.EMAIL_CONFIRMATION_SENT && (
        <Alert>
          <AlertDescription>{t('changeEmail.success')}</AlertDescription>
        </Alert>
      )}

      <AccountErrorAlert error={emailState?.error} />

      <form action={emailAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('changeEmail.newEmail')}</Label>
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
          <Label htmlFor="change-email-password">
            {t('changeEmail.password')}
          </Label>
          <Input
            id="change-email-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>
        <SubmitButton
          label={t('changeEmail.submit')}
          loadingLabel={t('changeEmail.submitting')}
        />
      </form>
    </section>
  )
}
