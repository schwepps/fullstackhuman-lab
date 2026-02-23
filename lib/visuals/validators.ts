import type {
  VisualData,
  ActionMatrixData,
  AssessmentRadarData,
  FrameworkMatrixData,
} from '@/lib/visuals/types'

// ─── Prompt-driven validators ───

export function validateActionMatrix(data: unknown): VisualData | null {
  if (
    !isObject(data) ||
    !Array.isArray((data as Record<string, unknown>).actions)
  )
    return null

  const raw = data as { actions: unknown[] }
  const actions: ActionMatrixData['actions'] = []

  for (const item of raw.actions) {
    if (!isObject(item)) continue
    const a = item as Record<string, unknown>
    if (
      typeof a.label !== 'string' ||
      typeof a.impact !== 'number' ||
      typeof a.urgency !== 'number' ||
      typeof a.index !== 'number'
    )
      continue
    if (a.impact < 1 || a.impact > 10 || a.urgency < 1 || a.urgency > 10)
      continue

    actions.push({
      label: a.label,
      impact: a.impact,
      urgency: a.urgency,
      index: a.index,
    })
  }

  if (actions.length < 2) return null
  return { type: 'action-matrix', data: { actions } }
}

export function validateAssessmentRadar(data: unknown): VisualData | null {
  if (
    !isObject(data) ||
    !Array.isArray((data as Record<string, unknown>).dimensions)
  )
    return null

  const raw = data as { dimensions: unknown[] }
  const dimensions: AssessmentRadarData['dimensions'] = []

  for (const item of raw.dimensions) {
    if (!isObject(item)) continue
    const d = item as Record<string, unknown>
    if (typeof d.name !== 'string' || typeof d.score !== 'number') continue
    if (d.score < 1 || d.score > 10) continue

    dimensions.push({
      name: d.name.slice(0, 20), // truncate long names
      score: d.score,
    })
  }

  if (dimensions.length < 3) return null // need at least 3 for a radar
  return { type: 'assessment-radar', data: { dimensions } }
}

export function validateFrameworkMatrix(data: unknown): VisualData | null {
  if (!isObject(data)) return null
  const d = data as Record<string, unknown>

  if (
    typeof d.title !== 'string' ||
    typeof d.xAxisLabel !== 'string' ||
    typeof d.xAxisLow !== 'string' ||
    typeof d.xAxisHigh !== 'string' ||
    typeof d.yAxisLabel !== 'string' ||
    typeof d.yAxisLow !== 'string' ||
    typeof d.yAxisHigh !== 'string' ||
    !isObject(d.quadrants)
  )
    return null

  const q = d.quadrants as Record<string, unknown>
  const quadrants: FrameworkMatrixData['quadrants'] = {
    topLeft: validateQuadrant(q.topLeft) || { label: '', description: '' },
    topRight: validateQuadrant(q.topRight) || { label: '', description: '' },
    bottomLeft: validateQuadrant(q.bottomLeft) || {
      label: '',
      description: '',
    },
    bottomRight: validateQuadrant(q.bottomRight) || {
      label: '',
      description: '',
    },
  }

  let userPosition: FrameworkMatrixData['userPosition'] | undefined
  if (isObject(d.userPosition)) {
    const pos = d.userPosition as Record<string, unknown>
    if (
      typeof pos.x === 'number' &&
      typeof pos.y === 'number' &&
      pos.x >= 0 &&
      pos.x <= 1 &&
      pos.y >= 0 &&
      pos.y <= 1
    ) {
      userPosition = { x: pos.x, y: pos.y }
    }
  }

  return {
    type: 'framework-matrix',
    data: {
      title: d.title as string,
      xAxisLabel: d.xAxisLabel as string,
      xAxisLow: d.xAxisLow as string,
      xAxisHigh: d.xAxisHigh as string,
      yAxisLabel: d.yAxisLabel as string,
      yAxisLow: d.yAxisLow as string,
      yAxisHigh: d.yAxisHigh as string,
      quadrants,
      userPosition,
    },
  }
}

function validateQuadrant(
  data: unknown
): { label: string; description: string } | null {
  if (!isObject(data)) return null
  const q = data as Record<string, unknown>
  if (typeof q.label !== 'string' || typeof q.description !== 'string')
    return null
  return { label: q.label, description: q.description }
}

export function validateConceptSpectrum(data: unknown): VisualData | null {
  if (!isObject(data)) return null
  const d = data as Record<string, unknown>

  if (
    typeof d.title !== 'string' ||
    typeof d.leftLabel !== 'string' ||
    typeof d.rightLabel !== 'string' ||
    typeof d.userPosition !== 'number' ||
    typeof d.userLabel !== 'string'
  )
    return null

  if (d.userPosition < 0 || d.userPosition > 1) return null

  return {
    type: 'concept-spectrum',
    data: {
      title: d.title,
      leftLabel: d.leftLabel,
      rightLabel: d.rightLabel,
      userPosition: d.userPosition,
      userLabel: d.userLabel,
      midLabel: typeof d.midLabel === 'string' ? d.midLabel : undefined,
    },
  }
}

// ─── Utility ───

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
