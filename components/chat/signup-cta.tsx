'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/use-analytics'

interface SignupCtaProps {
  remaining: number | null
  limit: number | null
}

export function SignupCta({ remaining, limit }: SignupCtaProps) {
  const t = useTranslations('chat.signupCta')
  const { trackCtaClick } = useAnalytics()

  function handleClick() {
    trackCtaClick({ source: 'signup_post_report' })
  }

  const showQuota = remaining !== null && limit !== null

  return (
    <Card className="terminal-border border-primary/20 bg-card/50">
      <CardContent className="flex flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="font-semibold text-primary">{t('title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('description')}
          </p>
          {showQuota && (
            <p className="mt-1 font-mono text-xs text-warning">
              {t('remaining', { remaining, limit })}
            </p>
          )}
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full touch-manipulation border-primary/30 sm:h-10 sm:w-auto"
          onClick={handleClick}
        >
          <Link href="/auth/signup">
            <UserPlus className="size-4" />
            {t('action')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
