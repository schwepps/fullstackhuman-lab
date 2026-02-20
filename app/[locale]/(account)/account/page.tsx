'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { Link } from '@/i18n/routing'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProfileSection } from '@/components/account/profile-section'
import { ChangePasswordForm } from '@/components/account/change-password-form'
import { ChangeEmailForm } from '@/components/account/change-email-form'
import { DeleteAccountDialog } from '@/components/account/delete-account-dialog'
import { useTranslations } from 'next-intl'

export default function AccountPage() {
  const t = useTranslations('account')
  const { user } = useAuth()

  const hasPasswordAuth =
    user?.identities?.some((i) => i.provider === 'email') ?? false

  return (
    <div className="space-y-8">
      <h1 className="terminal-text-glow text-2xl font-bold tracking-tight text-foreground">
        {t('title')}
      </h1>
      <ProfileSection user={user} />
      <Separator />
      {hasPasswordAuth ? (
        <>
          <ChangePasswordForm />
          <Separator />
          <ChangeEmailForm />
        </>
      ) : (
        <Alert>
          <AlertDescription>
            {t('oauthOnly.title')} &mdash; {t('oauthOnly.description')}{' '}
            <Link
              href="/auth/forgot-password"
              className="text-primary underline hover:text-primary/80"
            >
              {t('oauthOnly.setPasswordLink')}
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <Separator />
      <DeleteAccountDialog />
    </div>
  )
}
