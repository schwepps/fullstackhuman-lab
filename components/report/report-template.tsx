import { ReportTemplateHeader } from '@/components/report/report-template-header'
import { ReportTemplateFooter } from '@/components/report/report-template-footer'
import { ReportSectionBlock } from '@/components/report/report-section-block'
import { parseReport } from '@/lib/visuals/parser'
import { PERSONA_TEMPLATE_CONFIGS } from '@/lib/constants/report-templates'
import type { PersonaId } from '@/types/chat'

interface ReportTemplateProps {
  content: string
  persona: PersonaId
  createdAt: string
  isBranded: boolean
}

/**
 * Main report template — professional, light-themed document.
 * Parses raw markdown into structured sections with visual data,
 * then renders header, sections (with optional visuals), and footer.
 */
export async function ReportTemplate({
  content,
  persona,
  createdAt,
  isBranded,
}: ReportTemplateProps) {
  const config = PERSONA_TEMPLATE_CONFIGS[persona]
  const parsed = parseReport(content, persona)

  return (
    <article className="report-template mx-auto w-full max-w-3xl bg-white shadow-sm">
      <ReportTemplateHeader
        title={parsed.title}
        metadata={parsed.metadata}
        persona={persona}
        accentHex={config.accentHex}
        createdAt={createdAt}
      />

      <div className="divide-y divide-gray-50">
        {parsed.sections.map((section) => (
          <ReportSectionBlock
            key={section.index}
            section={section}
            config={config}
          />
        ))}
      </div>

      <ReportTemplateFooter
        ctaFooter={parsed.ctaFooter}
        accentColor={config.accentColor}
        isBranded={isBranded}
      />
    </article>
  )
}
