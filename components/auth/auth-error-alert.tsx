'use client'

import { useTranslations } from 'next-intl'
import { AUTH_ERROR, type AuthErrorCode } from '@/lib/auth/types'
import { Alert, AlertDescription } from '@/components/ui/alert'

type AuthPageErrorKey =
  | 'errors.invalidCredentials'
  | 'errors.passwordsDontMatch'
  | 'errors.rateLimited'
  | 'errors.generic'

const ERROR_KEY_MAP: Partial<Record<AuthErrorCode, AuthPageErrorKey>> = {
  [AUTH_ERROR.INVALID_CREDENTIALS]: 'errors.invalidCredentials',
  [AUTH_ERROR.PASSWORDS_DONT_MATCH]: 'errors.passwordsDontMatch',
  [AUTH_ERROR.RATE_LIMITED]: 'errors.rateLimited',
}

interface AuthErrorAlertProps {
  error: AuthErrorCode | undefined
}

/**
 * Shared error alert for auth pages (signup, forgot-password, reset-password).
 * Maps AUTH_ERROR codes to translated messages under the `auth` namespace.
 * Returns null for VALIDATION errors (handled by HTML validation).
 */
export function AuthErrorAlert({ error }: AuthErrorAlertProps) {
  const t = useTranslations('auth')

  if (!error || error === AUTH_ERROR.VALIDATION) return null

  const messageKey: AuthPageErrorKey = ERROR_KEY_MAP[error] ?? 'errors.generic'

  return (
    <Alert variant="destructive">
      <AlertDescription>{t(messageKey)}</AlertDescription>
    </Alert>
  )
}
