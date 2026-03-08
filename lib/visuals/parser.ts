import type { PersonaId } from '@/types/chat'
import type {
  ParsedReport,
  ReportSection,
  VisualData,
} from '@/lib/visuals/types'
import { PERSONA_TEMPLATE_CONFIGS } from '@/lib/constants/report-templates'
import {
  validateActionMatrix,
  validateAssessmentRadar,
  validateFrameworkMatrix,
  validateConceptSpectrum,
} from '@/lib/visuals/validators'
import {
  detectRiskLevel,
  detectRootCauseFlow,
  detectPriorityRoadmap,
  stripRiskLevelLine,
  stripMarkdownTable,
  stripNumberedList,
} from '@/lib/visuals/template-detectors'

// ─── Constants ───

type VisualBlockTag =
  | 'action-matrix'
  | 'assessment-radar'
  | 'framework-matrix'
  | 'concept-spectrum'

const VISUAL_BLOCK_REGEX =
  /```(action-matrix|assessment-radar|framework-matrix|concept-spectrum)\n([\s\S]*?)```/g

/** Regex matching persona emojis in legacy report titles (🩺🔍🧭) */
export const PERSONA_EMOJI_REGEX = /[\u{1FA7A}\u{1F50D}\u{1F9ED}]\s*/u

/** Strip visual fenced blocks from report content */
export function stripVisualBlocks(content: string): string {
  return content.replace(VISUAL_BLOCK_REGEX, '')
}

// ─── Main parse function ───

/**
 * Parse a Report into a structured ParsedReport with visual data extracted.
 * Pure function — deterministic, no side effects.
 */
export function parseReport(content: string, persona: PersonaId): ParsedReport {
  // Pass 1: Extract fenced visual blocks
  const { strippedContent, visualBlocks } = extractVisualBlocks(content)

  // Pass 2: Split into structural parts
  const {
    title,
    metadata,
    sections: rawSections,
    ctaFooter,
  } = splitReportStructure(strippedContent)

  // Pass 3: Attach visuals to sections (strip source patterns when visual detected)
  const config = PERSONA_TEMPLATE_CONFIGS[persona]
  const sections = rawSections.map((section) => {
    const { visual, strippedContent } = resolveVisualForSection(
      section,
      persona,
      config,
      visualBlocks
    )
    return {
      ...section,
      content: strippedContent ?? section.content,
      visual,
    }
  })

  return { title, metadata, sections, ctaFooter, persona }
}

// ─── Pass 1: Fenced block extraction ───

interface ExtractedBlocks {
  strippedContent: string
  visualBlocks: Map<VisualBlockTag, unknown>
}

function extractVisualBlocks(content: string): ExtractedBlocks {
  const visualBlocks = new Map<VisualBlockTag, unknown>()

  const strippedContent = content.replace(
    VISUAL_BLOCK_REGEX,
    (_match, tag: string, jsonStr: string) => {
      const parsed = safeJsonParse(jsonStr.trim())
      if (parsed !== null) {
        visualBlocks.set(tag as VisualBlockTag, parsed)
      }
      return '' // strip from content
    }
  )

  return { strippedContent, visualBlocks }
}

function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// ─── Pass 2: Structural splitting ───

interface RawStructure {
  title: string
  metadata: string
  sections: Omit<ReportSection, 'visual'>[]
  ctaFooter: string
}

function splitReportStructure(content: string): RawStructure {
  // Extract CTA footer: the italic block after the last ---
  const { body, ctaFooter } = extractCtaFooter(content)

  // Split on ## headings (not inside fenced code blocks)
  const parts = splitOnHeadings(body)

  // First part is the h1 block (title + metadata)
  const h1Block = parts[0] || ''
  const { title, metadata } = parseH1Block(h1Block)

  // Remaining parts are ## sections
  const sections: Omit<ReportSection, 'visual'>[] = parts
    .slice(1)
    .map((part, index) => {
      const firstNewline = part.indexOf('\n')
      const heading =
        firstNewline === -1 ? part.trim() : part.slice(0, firstNewline).trim()
      const sectionContent =
        firstNewline === -1 ? '' : part.slice(firstNewline + 1).trim()

      return { heading, content: sectionContent, index }
    })

  return { title, metadata, sections, ctaFooter }
}

function extractCtaFooter(content: string): {
  body: string
  ctaFooter: string
} {
  const lastHrIndex = content.lastIndexOf('\n---')
  if (lastHrIndex === -1) {
    return { body: content, ctaFooter: '' }
  }

  const afterHr = content.slice(lastHrIndex + 4).trim()
  if (afterHr.startsWith('_') || afterHr.includes('/book')) {
    return {
      body: content.slice(0, lastHrIndex).trim(),
      ctaFooter: afterHr,
    }
  }

  return { body: content, ctaFooter: '' }
}

/**
 * Split content on `## ` headings, respecting fenced code blocks.
 */
function splitOnHeadings(content: string): string[] {
  const parts: string[] = []
  let currentPart = ''
  let insideCodeBlock = false

  const lines = content.split('\n')

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      insideCodeBlock = !insideCodeBlock
    }

    if (!insideCodeBlock && line.startsWith('## ')) {
      parts.push(currentPart)
      currentPart = line.slice(3) + '\n'
      continue
    }

    currentPart += line + '\n'
  }

  if (currentPart) {
    parts.push(currentPart)
  }

  return parts
}

function parseH1Block(block: string): { title: string; metadata: string } {
  const lines = block.split('\n').filter((l) => l.trim())
  let title = ''
  const metadataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('# ') && !title) {
      title = line.slice(2).replace(PERSONA_EMOJI_REGEX, '').trim()
    } else if (line.startsWith('---')) {
      continue
    } else {
      metadataLines.push(line)
    }
  }

  const filteredMetadata = metadataLines.filter((line) => {
    const stripped = line.replace(/\*\*/g, '').trim()
    if (/^generated by/i.test(stripped)) return false
    if (/^date\s*:/i.test(stripped)) return false
    return true
  })

  return { title, metadata: filteredMetadata.join('\n').trim() }
}

// ─── Pass 3: Visual resolution ───

interface TemplateConfig {
  signatureSectionIndex: number
  visualMapping: Record<number, string>
}

interface VisualResolution {
  visual: VisualData | null
  strippedContent?: string
}

function resolveVisualForSection(
  section: Omit<ReportSection, 'visual'>,
  persona: PersonaId,
  config: TemplateConfig,
  visualBlocks: Map<VisualBlockTag, unknown>
): VisualResolution {
  const promptVisual = resolvePromptDrivenVisual(
    section,
    persona,
    config,
    visualBlocks
  )
  if (promptVisual) return { visual: promptVisual }

  return resolveTemplateDrivenVisual(section, persona, config)
}

function resolvePromptDrivenVisual(
  section: Omit<ReportSection, 'visual'>,
  _persona: PersonaId,
  config: TemplateConfig,
  visualBlocks: Map<VisualBlockTag, unknown>
): VisualData | null {
  const mappedTag = config.visualMapping[section.index]

  if (!mappedTag) return null

  const data = visualBlocks.get(mappedTag as VisualBlockTag)
  if (!data) return null

  switch (mappedTag) {
    case 'action-matrix':
      return validateActionMatrix(data)
    case 'assessment-radar':
      return validateAssessmentRadar(data)
    case 'framework-matrix':
      return validateFrameworkMatrix(data)
    case 'concept-spectrum':
      return validateConceptSpectrum(data)
    default:
      return null
  }
}

function resolveTemplateDrivenVisual(
  section: Omit<ReportSection, 'visual'>,
  persona: PersonaId,
  config: TemplateConfig
): VisualResolution {
  if (persona === 'doctor' && section.index === 3) {
    const riskData = detectRiskLevel(section.content)
    if (riskData) {
      return {
        visual: { type: 'risk-gauge', data: riskData },
        strippedContent: stripRiskLevelLine(section.content),
      }
    }
  }

  if (persona === 'doctor' && section.index === config.signatureSectionIndex) {
    const flowData = detectRootCauseFlow(section.content)
    if (flowData) {
      return {
        visual: { type: 'root-cause-flow', data: flowData },
        strippedContent: stripMarkdownTable(section.content),
      }
    }
  }

  const isPrioritySection =
    (persona === 'doctor' && section.index === 4) ||
    (persona === 'critic' && section.index === 4)
  if (isPrioritySection) {
    const roadmapData = detectPriorityRoadmap(section.content)
    if (roadmapData) {
      return {
        visual: { type: 'priority-roadmap', data: roadmapData },
        strippedContent: stripNumberedList(section.content),
      }
    }
  }

  return { visual: null }
}
