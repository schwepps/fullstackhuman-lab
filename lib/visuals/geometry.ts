/**
 * Pure geometry computation functions for report visuals.
 * Shared between web SVG components and react-pdf SVG components.
 * No React, no renderer imports — only math.
 */

export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * Convert polar coordinates (angle in degrees) to cartesian (x, y).
 * 0° = right (3 o'clock), 90° = bottom, 180° = left, 270° = top.
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): Point {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

/**
 * Generate an SVG arc path `d` string from startAngle to endAngle.
 * Angles in degrees, 0° = top (12 o'clock), clockwise.
 */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngleDeg)
  const end = polarToCartesian(cx, cy, r, startAngleDeg)
  const sweep = endAngleDeg - startAngleDeg
  const largeArc = sweep > 180 ? 1 : 0

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

/**
 * Generate an SVG donut/ring arc path (outer arc + inner arc, closed).
 */
export function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngleDeg)
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngleDeg)
  const innerStart = polarToCartesian(cx, cy, innerR, startAngleDeg)
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngleDeg)
  const sweep = endAngleDeg - startAngleDeg
  const largeArc = sweep > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

// ─── Risk Gauge ───

const RISK_GAUGE_START_ANGLE = 270 // left (9 o'clock)
const RISK_GAUGE_END_ANGLE = 450 // right (3 o'clock)
const RISK_GAUGE_RANGE = RISK_GAUGE_END_ANGLE - RISK_GAUGE_START_ANGLE

export const RISK_LEVEL_FRACTIONS: Record<string, number> = {
  low: 0.125,
  medium: 0.375,
  high: 0.625,
  critical: 0.875,
}

/**
 * Get the needle angle for a risk level.
 * Returns angle in degrees (270 = left, 450 = right).
 */
export function gaugeNeedleAngle(fraction: number): number {
  return RISK_GAUGE_START_ANGLE + fraction * RISK_GAUGE_RANGE
}

/**
 * Get the needle tip point for a gauge.
 */
export function gaugeNeedlePoint(
  cx: number,
  cy: number,
  r: number,
  fraction: number
): Point {
  return polarToCartesian(cx, cy, r, gaugeNeedleAngle(fraction))
}

/**
 * Get segment arc boundaries for the 4-segment gauge.
 * Returns [start, end] angle pairs for each segment.
 */
export function gaugeSegments(): Array<{
  startAngle: number
  endAngle: number
  level: string
}> {
  const segmentSize = RISK_GAUGE_RANGE / 4
  return [
    {
      startAngle: RISK_GAUGE_START_ANGLE,
      endAngle: RISK_GAUGE_START_ANGLE + segmentSize,
      level: 'low',
    },
    {
      startAngle: RISK_GAUGE_START_ANGLE + segmentSize,
      endAngle: RISK_GAUGE_START_ANGLE + segmentSize * 2,
      level: 'medium',
    },
    {
      startAngle: RISK_GAUGE_START_ANGLE + segmentSize * 2,
      endAngle: RISK_GAUGE_START_ANGLE + segmentSize * 3,
      level: 'high',
    },
    {
      startAngle: RISK_GAUGE_START_ANGLE + segmentSize * 3,
      endAngle: RISK_GAUGE_END_ANGLE,
      level: 'critical',
    },
  ]
}

// ─── Radar / Spider Chart ───

/**
 * Compute polygon vertex points for a radar chart.
 * Each score maps to a radius fraction (score/maxScore * outerRadius).
 * Points are evenly distributed, starting from top (12 o'clock).
 */
export function radarPolygonPoints(
  cx: number,
  cy: number,
  scores: number[],
  maxScore: number,
  outerRadius: number
): Point[] {
  const n = scores.length
  if (n === 0) return []

  const angleStep = 360 / n

  return scores.map((score, i) => {
    const angle = i * angleStep // 0° = top
    const r = (score / maxScore) * outerRadius
    return polarToCartesian(cx, cy, r, angle)
  })
}

/**
 * Compute the outer vertex points for the radar grid rings.
 */
export function radarGridPoints(
  cx: number,
  cy: number,
  radius: number,
  dimensions: number
): Point[] {
  const angleStep = 360 / dimensions
  return Array.from({ length: dimensions }, (_, i) =>
    polarToCartesian(cx, cy, radius, i * angleStep)
  )
}

/**
 * Convert an array of points to an SVG polygon `points` attribute string.
 */
export function pointsToSvgString(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

// ─── Action Priority Matrix (Eisenhower 2x2) ───

/**
 * Map an action's impact/urgency scores to pixel coordinates in the matrix.
 * Origin is bottom-left of the plot area.
 */
export function matrixDotPosition(
  plotX: number,
  plotY: number,
  plotWidth: number,
  plotHeight: number,
  impact: number,
  urgency: number,
  maxScore: number
): Point {
  return {
    x: plotX + (urgency / maxScore) * plotWidth,
    y: plotY + plotHeight - (impact / maxScore) * plotHeight,
  }
}

// ─── Framework Matrix (2x2 Quadrant) ───

export interface QuadrantBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly centerX: number
  readonly centerY: number
}

/**
 * Compute bounds for each quadrant of a 2x2 matrix.
 */
export function quadrantBounds(
  plotX: number,
  plotY: number,
  plotWidth: number,
  plotHeight: number
): {
  topLeft: QuadrantBounds
  topRight: QuadrantBounds
  bottomLeft: QuadrantBounds
  bottomRight: QuadrantBounds
} {
  const halfW = plotWidth / 2
  const halfH = plotHeight / 2

  const makeBounds = (x: number, y: number): QuadrantBounds => ({
    x,
    y,
    width: halfW,
    height: halfH,
    centerX: x + halfW / 2,
    centerY: y + halfH / 2,
  })

  return {
    topLeft: makeBounds(plotX, plotY),
    topRight: makeBounds(plotX + halfW, plotY),
    bottomLeft: makeBounds(plotX, plotY + halfH),
    bottomRight: makeBounds(plotX + halfW, plotY + halfH),
  }
}

/**
 * Map a 0-1 position fraction to a pixel coordinate within the plot area.
 */
export function frameworkUserPosition(
  plotX: number,
  plotY: number,
  plotWidth: number,
  plotHeight: number,
  xFraction: number,
  yFraction: number
): Point {
  return {
    x: plotX + xFraction * plotWidth,
    y: plotY + plotHeight - yFraction * plotHeight,
  }
}

// ─── Concept Spectrum ───

/**
 * Map a 0-1 fraction to a pixel position along the spectrum track.
 */
export function spectrumTickX(
  startX: number,
  trackWidth: number,
  fraction: number
): number {
  return startX + fraction * trackWidth
}

// ─── SVG arrowhead (for flow diagrams) ───

/**
 * Generate an SVG path for a right-pointing arrowhead at a given position.
 */
export function arrowheadPath(
  tipX: number,
  tipY: number,
  size: number
): string {
  return [
    `M ${tipX} ${tipY}`,
    `L ${tipX - size} ${tipY - size / 2}`,
    `L ${tipX - size} ${tipY + size / 2}`,
    'Z',
  ].join(' ')
}

/**
 * Generate an SVG path for a downward-pointing arrowhead at a given position.
 */
export function downArrowheadPath(
  tipX: number,
  tipY: number,
  size: number
): string {
  return [
    `M ${tipX} ${tipY}`,
    `L ${tipX - size / 2} ${tipY - size}`,
    `L ${tipX + size / 2} ${tipY - size}`,
    'Z',
  ].join(' ')
}
