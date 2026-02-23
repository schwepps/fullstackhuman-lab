import type { RiskLevel } from '@/lib/visuals/types'

// ─── Shared visual utilities ───

/**
 * Truncate text to a max length, appending an ellipsis if truncated.
 * Used by web SVG and react-pdf SVG visual components.
 */
export function truncateLabel(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}

// ─── Risk Gauge colors & labels ───

export const GAUGE_SEGMENT_COLORS: Record<string, string> = {
  low: '#06b6d4', // cyan-500
  medium: '#f59e0b', // amber-500
  high: '#f97316', // orange-500
  critical: '#ef4444', // red-500
}

export const GAUGE_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

// ─── Framework Matrix quadrant fills ───

export const FRAMEWORK_QUADRANT_FILLS: Record<string, string> = {
  topLeft: '#f0fdf4', // emerald-50
  topRight: '#ecfdf5', // emerald-50 variant
  bottomLeft: '#fafafa', // gray-50
  bottomRight: '#fefce8', // yellow-50
}
