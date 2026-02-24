import React from 'react'
import {
  RiskGaugePdf,
  RootCauseFlowPdf,
  ActionMatrixPdf,
  AssessmentRadarPdf,
  PriorityRoadmapPdf,
  FrameworkMatrixPdf,
  ConceptSpectrumPdf,
} from '@/components/visuals/pdf'
import type { VisualData } from '@/lib/visuals/types'

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

export function PdfVisualRenderer({
  visual,
  accentHex,
}: {
  visual: VisualData
  accentHex: string
}) {
  const render = PDF_VISUAL_MAP[visual.type]
  return render ? render(visual, accentHex) : null
}
