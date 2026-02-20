'use client'

import { useTranslations } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import { getDisplayName } from '@/lib/auth/display-name'

interface ProfileSectionProps {
  user: User | null
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const t = useTranslations('account')

  const displayName = getDisplayName(user)

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('profile.title')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
          <p className="font-mono text-sm text-foreground">
            {user?.email ?? '...'}
          </p>
        </div>
        {displayName && (
          <div>
            <p className="text-sm text-muted-foreground">
              {t('profile.displayName')}
            </p>
            <p className="text-sm text-foreground">{displayName}</p>
          </div>
        )}
      </div>
    </section>
  )
}
