import { getTranslations } from 'next-intl/server'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { MarkdownRenderer } from '@/components/chat/markdown-renderer'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import { CalendlyCta } from '@/components/shared/calendly-cta'
import { ShareButton } from '@/components/report/share-button'
import { ReportBrandingFooter } from '@/components/report/report-branding-footer'
import { PERSONAS } from '@/lib/constants/personas'
import { buildReportShareUrl } from '@/lib/constants/reports'
import type { Report } from '@/types/report'

interface ReportViewProps {
  report: Report
  locale: string
}

export async function ReportView({ report, locale }: ReportViewProps) {
  const t = await getTranslations('report')
  const Illustration = PERSONA_ILLUSTRATIONS[report.persona]
  const personaEmoji = PERSONAS[report.persona].emoji

  const shareUrl = buildReportShareUrl(report.shareToken, locale)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Card className="terminal-border border-primary/30 bg-card/50">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Illustration className="size-5 text-primary" />
            <span className="font-mono uppercase tracking-wider">
              {t('label')} {personaEmoji}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer content={report.content} />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <ShareButton shareUrl={shareUrl} persona={report.persona} />
          <CalendlyCta variant="inline" source="public_report" />
        </CardFooter>
      </Card>

      <div className="mt-6">
        <CalendlyCta variant="banner" source="public_report" />
      </div>

      {report.isBranded && <ReportBrandingFooter />}
    </div>
  )
}
