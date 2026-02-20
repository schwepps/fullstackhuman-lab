'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { forgotPasswordAction } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthErrorAlert } from '@/components/auth/auth-error-alert'
import { SubmitButton } from '@/components/auth/submit-button'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')

  const [state, formAction] = useActionState(forgotPasswordAction, null)

  if (state?.success) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="terminal-text-glow text-2xl font-bold tracking-tight text-foreground">
            {t('forgotPassword.title')}
          </h1>
        </div>

        <Alert>
          <AlertDescription>{t('forgotPassword.success')}</AlertDescription>
        </Alert>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-primary hover:text-primary/80"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="terminal-text-glow text-2xl font-bold tracking-tight text-foreground">
          {t('forgotPassword.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('forgotPassword.subtitle')}
        </p>
      </div>

      <AuthErrorAlert error={state?.error} />

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('forgotPassword.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 text-base sm:h-10 sm:text-sm"
          />
        </div>

        <SubmitButton
          label={t('forgotPassword.submit')}
          loadingLabel={t('forgotPassword.submitting')}
        />
      </form>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-primary hover:text-primary/80"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
