import { renderToBuffer } from '@react-pdf/renderer'
import { getReportByToken } from '@/lib/reports/queries'
import { ReportPdfDocument } from '@/lib/pdf/report-pdf-document'
import { SHARE_TOKEN_REGEX } from '@/lib/constants/reports'

const PERSONA_FILE_PREFIX = {
  doctor: 'Diagnostic-Report',
  critic: 'Review-Brief',
  guide: 'Framework-Brief',
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Validate token format
  if (!SHARE_TOKEN_REGEX.test(token)) {
    return new Response('Invalid token', { status: 400 })
  }

  // Fetch report
  const report = await getReportByToken(token)
  if (!report) {
    return new Response('Report not found', { status: 404 })
  }

  // Generate PDF
  const buffer = await renderToBuffer(
    <ReportPdfDocument
      content={report.content}
      persona={report.persona}
      createdAt={report.createdAt}
    />
  )

  const prefix = PERSONA_FILE_PREFIX[report.persona]
  const filename = `${prefix}-FullStackHuman.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
