import { getTranslations } from 'next-intl/server'
import { ProfessionalMarkdown } from '@/components/report/professional-markdown'

interface ReportTemplateFooterProps {
  ctaFooter: string
  accentColor: string
  isBranded: boolean
}

export async function ReportTemplateFooter({
  ctaFooter,
  accentColor,
  isBranded,
}: ReportTemplateFooterProps) {
  const t = await getTranslations('reportTemplate')

  return (
    <footer className="px-6 pb-6 sm:px-8">
      {/* AI-authored CTA from report markdown */}
      {ctaFooter && (
        <div className="mt-6 border-t-2 border-gray-200 pt-6">
          <ProfessionalMarkdown content={ctaFooter} accentColor={accentColor} />
        </div>
      )}

      {/* Branding watermark for free-tier reports */}
      {isBranded && (
        <p className="mt-4 text-center text-[10px] text-gray-300">
          {t('generatedBy')}
        </p>
      )}
    </footer>
  )
}
