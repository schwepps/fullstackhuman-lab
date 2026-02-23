import type { PersonaId } from '@/types/chat'

// ─── Template-driven visual data (detected from existing markdown) ───

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskGaugeData {
  readonly level: RiskLevel
}

export interface FlowRow {
  readonly symptom: string
  readonly rootCause: string
}

export interface RootCauseFlowData {
  readonly rows: FlowRow[]
}

export interface RoadmapItem {
  readonly index: number
  readonly label: string
  readonly fullText: string
}

export interface PriorityRoadmapData {
  readonly items: RoadmapItem[]
}

// ─── Prompt-driven visual data (from fenced code blocks) ───

export interface ActionItem {
  readonly label: string
  readonly impact: number // 1-10
  readonly urgency: number // 1-10
  readonly index: number // 1-5
}

export interface ActionMatrixData {
  readonly actions: ActionItem[]
}

export interface RadarDimension {
  readonly name: string
  readonly score: number // 1-10
}

export interface AssessmentRadarData {
  readonly dimensions: RadarDimension[]
}

export interface MatrixQuadrant {
  readonly label: string
  readonly description: string
}

export interface FrameworkMatrixData {
  readonly title: string
  readonly xAxisLabel: string
  readonly xAxisLow: string
  readonly xAxisHigh: string
  readonly yAxisLabel: string
  readonly yAxisLow: string
  readonly yAxisHigh: string
  readonly quadrants: {
    readonly topLeft: MatrixQuadrant
    readonly topRight: MatrixQuadrant
    readonly bottomLeft: MatrixQuadrant
    readonly bottomRight: MatrixQuadrant
  }
  readonly userPosition?: { readonly x: number; readonly y: number }
}

export interface ConceptSpectrumData {
  readonly title: string
  readonly leftLabel: string
  readonly rightLabel: string
  readonly userPosition: number // 0-1 fraction from left
  readonly userLabel: string
  readonly midLabel?: string
}

// ─── Visual type discriminated union ───

export type VisualData =
  | { readonly type: 'risk-gauge'; readonly data: RiskGaugeData }
  | { readonly type: 'root-cause-flow'; readonly data: RootCauseFlowData }
  | { readonly type: 'priority-roadmap'; readonly data: PriorityRoadmapData }
  | { readonly type: 'action-matrix'; readonly data: ActionMatrixData }
  | { readonly type: 'assessment-radar'; readonly data: AssessmentRadarData }
  | { readonly type: 'framework-matrix'; readonly data: FrameworkMatrixData }
  | { readonly type: 'concept-spectrum'; readonly data: ConceptSpectrumData }

// ─── Parsed report structure ───

export interface ReportSection {
  readonly heading: string
  readonly content: string
  readonly index: number
  readonly visual: VisualData | null
}

export interface ParsedReport {
  readonly title: string
  readonly metadata: string
  readonly sections: ReportSection[]
  readonly ctaFooter: string
  readonly persona: PersonaId
}
