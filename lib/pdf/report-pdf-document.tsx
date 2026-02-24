import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles as s } from '@/lib/pdf/styles'
import { MarkdownToPdf } from '@/lib/pdf/markdown-to-pdf'
import {
  RiskGaugePdf,
  RootCauseFlowPdf,
  ActionMatrixPdf,
  AssessmentRadarPdf,
  PriorityRoadmapPdf,
  FrameworkMatrixPdf,
  ConceptSpectrumPdf,
} from '@/components/visuals/pdf'
import { FshIconMarkPdf } from '@/components/visuals/pdf/fsh-icon-mark-pdf'
import { PersonaIconPdf } from '@/components/visuals/pdf/persona-icons-pdf'
import { parseReport } from '@/lib/visuals/parser'
import {
  PERSONA_TEMPLATE_CONFIGS,
  PERSONA_DISPLAY_NAMES,
} from '@/lib/constants/report-templates'
import type { PersonaId } from '@/types/chat'
import type { VisualData } from '@/lib/visuals/types'

/** Clean CTA text for PDF: strip italic `_` markers and unsupported Unicode (→ arrow). */
function cleanCtaForPdf(text: string): string {
  return text
    .replace(/^_\s?|\s?_\s*$/gm, '') // strip leading/trailing _ italic markers
    .replace(/\s*→/g, '') // strip → arrow (unsupported in Helvetica)
}

interface ReportPdfDocumentProps {
  content: string
  persona: PersonaId
  createdAt: string
}

export function ReportPdfDocument({
  content,
  persona,
  createdAt,
}: ReportPdfDocumentProps) {
  const config = PERSONA_TEMPLATE_CONFIGS[persona]
  const parsed = parseReport(content, persona)
  const date = new Date(createdAt)
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Accent bar at top */}
        <View
          style={[s.headerBar, { backgroundColor: config.accentHex }]}
          fixed
        />

        {/* Running header */}
        <View style={s.pageHeader} fixed>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <FshIconMarkPdf width={48} color="#6b7280" />
            <Text style={s.pageHeaderText}>Full Stack Human</Text>
          </View>
          <Text style={s.pageHeaderText}>{dateStr}</Text>
        </View>

        {/* Running footer */}
        <View style={s.pageFooter} fixed>
          <Text style={s.pageFooterText}>{PERSONA_DISPLAY_NAMES[persona]}</Text>
          <Text
            style={s.pageFooterText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>

        {/* Persona badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
          <PersonaIconPdf persona={persona} color={config.accentHex} />
          <Text
            style={[
              s.personaBadge,
              { color: config.accentHex, marginBottom: 0 },
            ]}
          >
            {PERSONA_DISPLAY_NAMES[persona]}
          </Text>
        </View>

        {/* Title */}
        <Text style={s.title}>{parsed.title}</Text>

        {/* Divider */}
        <View
          style={[
            s.divider,
            { backgroundColor: config.accentHex, opacity: 0.2 },
          ]}
        />

        {/* Sections */}
        {parsed.sections.map((section) => {
          const isSignature = section.index === config.signatureSectionIndex
          return (
            <View key={section.index} wrap={false}>
              {/* Section heading */}
              <Text
                style={[
                  s.sectionHeading,
                  { color: isSignature ? '#111827' : config.accentHex },
                ]}
              >
                {section.heading}
              </Text>

              {/* Visual */}
              {section.visual && (
                <View style={s.visualContainer}>
                  <PdfVisualRenderer
                    visual={section.visual}
                    accentHex={config.accentHex}
                  />
                </View>
              )}

              {/* Content with signature treatment */}
              {isSignature ? (
                <View
                  style={
                    config.signatureTreatment === 'callout'
                      ? [
                          s.signatureCallout,
                          { borderLeftColor: config.accentHex },
                        ]
                      : config.signatureTreatment === 'table'
                        ? [
                            s.signatureTable,
                            { backgroundColor: `${config.accentHexLight}80` },
                          ]
                        : s.signatureStatement
                  }
                >
                  <MarkdownToPdf
                    content={section.content}
                    accentHex={config.accentHex}
                  />
                </View>
              ) : (
                <MarkdownToPdf
                  content={section.content}
                  accentHex={config.accentHex}
                />
              )}
            </View>
          )
        })}

        {/* CTA footer */}
        {parsed.ctaFooter && (
          <View style={{ marginTop: 16 }}>
            <View style={[s.divider, { backgroundColor: '#e5e7eb' }]} />
            <MarkdownToPdf
              content={cleanCtaForPdf(parsed.ctaFooter)}
              accentHex={config.accentHex}
              baseFontFamily="Helvetica-Oblique"
            />
          </View>
        )}

        {/* Branding */}
        <Text style={s.branding}>
          Generated by Full Stack Human - François Schuers
        </Text>
      </Page>
    </Document>
  )
}

// ─── PDF Visual Dispatcher (map-based to avoid duplication with web dispatcher) ───

const PDF_VISUAL_MAP: Record<
  string,
  (visual: VisualData, hex: string) => React.ReactElement | null
> = {
  'risk-gauge': (v) =>
    v.type === 'risk-gauge' ? <RiskGaugePdf data={v.data} /> : null,
  'root-cause-flow': (v, hex) =>
    v.type === 'root-cause-flow' ? (
      <RootCauseFlowPdf data={v.data} accentHex={hex} />
    ) : null,
  'action-matrix': (v, hex) =>
    v.type === 'action-matrix' ? (
      <ActionMatrixPdf data={v.data} accentHex={hex} />
    ) : null,
  'assessment-radar': (v, hex) =>
    v.type === 'assessment-radar' ? (
      <AssessmentRadarPdf data={v.data} accentHex={hex} />
    ) : null,
  'priority-roadmap': (v, hex) =>
    v.type === 'priority-roadmap' ? (
      <PriorityRoadmapPdf data={v.data} accentHex={hex} />
    ) : null,
  'framework-matrix': (v, hex) =>
    v.type === 'framework-matrix' ? (
      <FrameworkMatrixPdf data={v.data} accentHex={hex} />
    ) : null,
  'concept-spectrum': (v, hex) =>
    v.type === 'concept-spectrum' ? (
      <ConceptSpectrumPdf data={v.data} accentHex={hex} />
    ) : null,
}

function PdfVisualRenderer({
  visual,
  accentHex,
}: {
  visual: VisualData
  accentHex: string
}) {
  const render = PDF_VISUAL_MAP[visual.type]
  return render ? render(visual, accentHex) : null
}
