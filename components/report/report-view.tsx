import { ReportTemplate } from '@/components/report/report-template'
import { ShareButton } from '@/components/report/share-button'
import { DownloadPdfButton } from '@/components/report/download-pdf-button'
import { CalendlyCta } from '@/components/shared/calendly-cta'
import { buildReportShareUrl } from '@/lib/constants/reports'
import type { Report } from '@/types/report'

interface ReportViewProps {
  report: Report
  locale: string
}

export async function ReportView({ report, locale }: ReportViewProps) {
  const shareUrl = buildReportShareUrl(report.shareToken, locale)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Action bar — share + booking outside the report card */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ShareButton shareUrl={shareUrl} persona={report.persona} />
        <DownloadPdfButton shareToken={report.shareToken} />
        <CalendlyCta
          variant="inline"
          source="public_report"
          buttonVariant="default"
        />
      </div>

      {/* Professional report template */}
      <ReportTemplate
        content={report.content}
        persona={report.persona}
        createdAt={report.createdAt}
        isBranded={report.isBranded}
      />
    </div>
  )
}
