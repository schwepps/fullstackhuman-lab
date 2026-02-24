import { ProfessionalMarkdown } from '@/components/report/professional-markdown'
import {
  RiskGauge,
  RootCauseFlow,
  ActionPriorityMatrix,
  AssessmentRadar,
  PriorityRoadmap,
  FrameworkMatrix,
  ConceptSpectrum,
} from '@/components/visuals/web'
import type { ReportSection, VisualData } from '@/lib/visuals/types'
import type { PersonaTemplateConfig } from '@/lib/constants/report-templates'

interface ReportSectionBlockProps {
  section: ReportSection
  config: PersonaTemplateConfig
}

/**
 * Renders a single report section with optional visual and signature treatment.
 * Visual components render above the section's prose markdown.
 * Signature sections get special border/background treatment.
 */
export function ReportSectionBlock({
  section,
  config,
}: ReportSectionBlockProps) {
  const isSignature = section.index === config.signatureSectionIndex
  const accentColor = config.accentColor
  const accentHex = config.accentHex

  return (
    <section className="px-6 py-6 sm:px-8 sm:py-8">
      {/* Section heading */}
      <h2
        className={`mb-3 text-lg font-semibold ${
          isSignature ? 'text-gray-900' : ''
        }`}
        style={isSignature ? undefined : { color: accentHex }}
      >
        {section.heading}
      </h2>

      {/* Visual component — renders above prose */}
      {section.visual && (
        <div className="mt-4 mb-8 border border-gray-100 p-3">
          <VisualRenderer visual={section.visual} accentHex={accentHex} />
        </div>
      )}

      {/* Prose markdown (skip if content was stripped empty) */}
      {section.content.trim() &&
        (isSignature ? (
          <SignatureWrapper
            treatment={config.signatureTreatment}
            accentColor={accentColor}
          >
            <ProfessionalMarkdown
              content={section.content}
              accentColor={accentColor}
            />
          </SignatureWrapper>
        ) : (
          <ProfessionalMarkdown
            content={section.content}
            accentColor={accentColor}
          />
        ))}
    </section>
  )
}

// ─── Visual Dispatcher ───

function VisualRenderer({
  visual,
  accentHex,
}: {
  visual: VisualData
  accentHex: string
}) {
  switch (visual.type) {
    case 'risk-gauge':
      return <RiskGauge data={visual.data} />
    case 'root-cause-flow':
      return <RootCauseFlow data={visual.data} accentHex={accentHex} />
    case 'action-matrix':
      return <ActionPriorityMatrix data={visual.data} accentHex={accentHex} />
    case 'assessment-radar':
      return <AssessmentRadar data={visual.data} accentHex={accentHex} />
    case 'priority-roadmap':
      return <PriorityRoadmap data={visual.data} accentHex={accentHex} />
    case 'framework-matrix':
      return <FrameworkMatrix data={visual.data} accentHex={accentHex} />
    case 'concept-spectrum':
      return <ConceptSpectrum data={visual.data} accentHex={accentHex} />
    default:
      return null
  }
}

// ─── Signature Treatments ───

interface SignatureWrapperProps {
  treatment: PersonaTemplateConfig['signatureTreatment']
  accentColor: string
  children: React.ReactNode
}

const SIGNATURE_BORDER: Record<string, string> = {
  cyan: 'border-cyan-700',
  amber: 'border-amber-700',
  emerald: 'border-emerald-700',
}

const SIGNATURE_BG: Record<string, string> = {
  cyan: 'bg-cyan-50',
  amber: 'bg-amber-50',
  emerald: 'bg-emerald-50',
}

function SignatureWrapper({
  treatment,
  accentColor,
  children,
}: SignatureWrapperProps) {
  const border = SIGNATURE_BORDER[accentColor] || SIGNATURE_BORDER.cyan
  const bg = SIGNATURE_BG[accentColor] || SIGNATURE_BG.cyan

  switch (treatment) {
    case 'table':
      // Doctor: table in signature section gets subtle accent background
      return <div className={`rounded ${bg} p-4`}>{children}</div>
    case 'callout':
      // Critic: bold left border callout
      return (
        <div className={`border-l-4 ${border} pl-4 ${bg} rounded-r p-4`}>
          {children}
        </div>
      )
    case 'statement':
      // Guide: centered emphasis with top/bottom borders
      return <div className={`border-y ${border}/20 py-4`}>{children}</div>
    default:
      return <>{children}</>
  }
}
