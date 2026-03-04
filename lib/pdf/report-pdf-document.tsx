import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles as s } from '@/lib/pdf/styles'
import { MarkdownToPdf } from '@/lib/pdf/markdown-to-pdf'
import { PdfVisualRenderer } from '@/lib/pdf/pdf-visual-renderer'
import { FshIconMarkPdf } from '@/components/visuals/pdf/fsh-icon-mark-pdf'
import { BRAND_NAME_DISPLAY } from '@/lib/constants/brand'
import { PersonaIconPdf } from '@/components/visuals/pdf/persona-icons-pdf'
import { parseReport } from '@/lib/visuals/parser'
import {
  PERSONA_TEMPLATE_CONFIGS,
  PERSONA_DISPLAY_NAMES,
} from '@/lib/constants/report-templates'
import type { PersonaId } from '@/types/chat'

/** Clean CTA text for PDF: strip italic `_` markers and unsupported Unicode. */
function cleanCtaForPdf(text: string): string {
  return text.replace(/^_\s?|\s?_\s*$/gm, '').replace(/\s*→/g, '')
}

interface ReportPdfDocumentProps {
  content: string
  persona: PersonaId
  createdAt: string
  brandingText: string
}

export function ReportPdfDocument({
  content,
  persona,
  createdAt,
  brandingText,
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
            <Text style={s.pageHeaderText}>{BRAND_NAME_DISPLAY}</Text>
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
              <Text
                style={[
                  s.sectionHeading,
                  { color: isSignature ? '#111827' : config.accentHex },
                ]}
              >
                {section.heading}
              </Text>

              {section.visual && (
                <View style={s.visualContainer}>
                  <PdfVisualRenderer
                    visual={section.visual}
                    accentHex={config.accentHex}
                  />
                </View>
              )}

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
        <Text style={s.branding}>{brandingText}</Text>
      </Page>
    </Document>
  )
}
