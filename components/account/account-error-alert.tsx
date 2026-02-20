'use client'

import { useTranslations } from 'next-intl'
import { AUTH_ERROR, type AuthErrorCode } from '@/lib/auth/types'
import { Alert, AlertDescription } from '@/components/ui/alert'

type AccountErrorKey =
  | 'errors.wrongPassword'
  | 'errors.rateLimited'
  | 'errors.passwordsDontMatch'
  | 'errors.samePassword'
  | 'errors.generic'

const ERROR_KEY_MAP: Partial<Record<AuthErrorCode, AccountErrorKey>> = {
  [AUTH_ERROR.WRONG_PASSWORD]: 'errors.wrongPassword',
  [AUTH_ERROR.RATE_LIMITED]: 'errors.rateLimited',
  [AUTH_ERROR.PASSWORDS_DONT_MATCH]: 'errors.passwordsDontMatch',
  [AUTH_ERROR.SAME_PASSWORD]: 'errors.samePassword',
}

interface AccountErrorAlertProps {
  error: AuthErrorCode | undefined
}

/**
 * Shared error alert for account forms.
 * Maps AUTH_ERROR codes to translated messages under the `account` namespace.
 * Returns null for VALIDATION errors (handled by HTML validation).
 */
export function AccountErrorAlert({ error }: AccountErrorAlertProps) {
  const t = useTranslations('account')

  if (!error || error === AUTH_ERROR.VALIDATION) return null

  const messageKey: AccountErrorKey = ERROR_KEY_MAP[error] ?? 'errors.generic'

  return (
    <Alert variant="destructive">
      <AlertDescription>{t(messageKey)}</AlertDescription>
    </Alert>
  )
}
