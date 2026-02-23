import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

export async function ReportBrandingFooter() {
  const t = await getTranslations('report')

  return (
    <p className="mt-4 text-center text-xs text-muted-foreground">
      {t('brandingPrefix')}{' '}
      <Link href="/" className="text-primary underline hover:text-accent">
        {t('brandingLink')}
      </Link>
    </p>
  )
}
