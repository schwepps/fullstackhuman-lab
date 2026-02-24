import type { PersonaId } from '@/types/chat'

/**
 * Persona-specific template configuration for report rendering.
 * SSOT for accent colors, signature section detection, and visual mapping.
 *
 * Section indices reference the fixed prompt template order (0-based, ## headings only):
 *
 * Doctor:  0=Patient summary, 1=Diagnosis, 2=Symptoms vs root cause (SIGNATURE),
 *          3=Risk level, 4=Recommended actions, 5=What the AI can't see
 *
 * Critic:  0=What I reviewed, 1=What works, 2=What doesn't work,
 *          3=The thing nobody's telling you (SIGNATURE), 4=If I had to prioritize,
 *          5=Where this review stops
 *
 * Guide:   0=What you asked, 1=How to think about this, 2=The reframe (SIGNATURE),
 *          3=Applied to your situation, 4=What to sit with, 5=Where this goes deeper
 */

export interface PersonaTemplateConfig {
  /** Tailwind color prefix for WCAG AA on white (e.g., 'cyan', 'amber', 'emerald') */
  readonly accentColor: string
  /** Hex color for contexts without Tailwind (PDF, OG images) */
  readonly accentHex: string
  /** Light accent hex for backgrounds */
  readonly accentHexLight: string
  /** 0-based index of the signature ## section */
  readonly signatureSectionIndex: number
  /** Visual treatment for the signature section */
  readonly signatureTreatment: 'table' | 'callout' | 'statement'
  /**
   * Maps section index → fenced code block tag for prompt-driven visuals.
   * Only sections with prompt-driven visuals are listed.
   */
  readonly visualMapping: Record<number, string>
}

export const PERSONA_TEMPLATE_CONFIGS: Record<
  PersonaId,
  PersonaTemplateConfig
> = {
  doctor: {
    accentColor: 'cyan',
    accentHex: '#0e7490', // cyan-700
    accentHexLight: '#ecfeff', // cyan-50
    signatureSectionIndex: 2,
    signatureTreatment: 'table',
    visualMapping: {
      4: 'action-matrix', // Recommended actions
    },
  },
  critic: {
    accentColor: 'amber',
    accentHex: '#b45309', // amber-700
    accentHexLight: '#fffbeb', // amber-50
    signatureSectionIndex: 3,
    signatureTreatment: 'callout',
    visualMapping: {
      0: 'assessment-radar', // After "What I reviewed" (placed before section 1)
    },
  },
  guide: {
    accentColor: 'emerald',
    accentHex: '#047857', // emerald-700
    accentHexLight: '#ecfdf5', // emerald-50
    signatureSectionIndex: 2,
    signatureTreatment: 'callout',
    visualMapping: {
      1: 'framework-matrix', // "How to think about this" — or concept-spectrum
    },
  },
} as const

/**
 * English persona display names for non-i18n contexts (PDF generation).
 * Must stay in sync with messages/en.json reportTemplate.personaName.
 */
export const PERSONA_DISPLAY_NAMES: Record<PersonaId, string> = {
  doctor: 'The Doctor',
  critic: 'The Critic',
  guide: 'The Guide',
}

/**
 * PDF filename prefixes per persona.
 */
export const PERSONA_PDF_PREFIX: Record<PersonaId, string> = {
  doctor: 'Diagnostic-Report',
  critic: 'Review-Brief',
  guide: 'Framework-Brief',
}

/**
 * Report template i18n key map (keys within 'reportTemplate' namespace).
 */
export const REPORT_TEMPLATE_KEYS = {
  generatedBy: 'generatedBy',
  downloadPdf: 'downloadPdf',
  personaName: {
    doctor: 'personaName.doctor',
    critic: 'personaName.critic',
    guide: 'personaName.guide',
  },
  signatureBadge: {
    doctor: 'signatureBadge.doctor',
    critic: 'signatureBadge.critic',
    guide: 'signatureBadge.guide',
  },
} as const
