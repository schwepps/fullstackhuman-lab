/**
 * Template-driven visual detectors and content strippers.
 * Detect visual data patterns (tables, numbered lists, keywords) in markdown content
 * and strip the source patterns after extraction.
 */

import type { RiskLevel, RootCauseFlowData, PriorityRoadmapData } from './types'

// ─── Regex patterns ───

const RISK_LEVEL_REGEX = /^\*{0,2}\s*(Low|Medium|High|Critical)\b/im

const TABLE_SEPARATOR_REGEX = /^\|[\s-:|]+\|$/

const NUMBERED_ITEM_REGEX = /^\d+\.\s+\*\*([^*]+)\*\*\s*[—–-]\s*(.*)/gm

// ─── Detectors ───

export function detectRiskLevel(content: string): { level: RiskLevel } | null {
  const match = content.match(RISK_LEVEL_REGEX)
  if (!match) return null

  const level = match[1].toLowerCase()
  if (
    level === 'low' ||
    level === 'medium' ||
    level === 'high' ||
    level === 'critical'
  ) {
    return { level }
  }

  return null
}

export function detectRootCauseFlow(content: string): RootCauseFlowData | null {
  const lines = content.split('\n')
  const tableLines = lines.filter(
    (l) => l.trimStart().startsWith('|') && l.trimEnd().endsWith('|')
  )

  if (tableLines.length < 3) return null // need header + separator + at least 1 row

  // Skip header and separator rows
  const dataRows = tableLines.filter((line) => {
    const trimmed = line.trim()
    return !TABLE_SEPARATOR_REGEX.test(trimmed)
  })

  // First non-separator row is the header
  const headerRow = dataRows[0]
  if (!headerRow) return null

  const headerCells = parseTableRow(headerRow)
  if (headerCells.length !== 2) return null // must be exactly 2 columns

  // Remaining rows are data
  const rows = dataRows.slice(1).map((line) => {
    const cells = parseTableRow(line)
    return {
      symptom:
        cells[0]?.replace(/^[\u201C\u201D"]|[\u201C\u201D"]$/g, '').trim() ||
        '',
      rootCause: cells[1]?.trim() || '',
    }
  })

  if (rows.length === 0) return null

  return { rows }
}

export function detectPriorityRoadmap(
  content: string
): PriorityRoadmapData | null {
  const items: PriorityRoadmapData['items'] = []

  NUMBERED_ITEM_REGEX.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = NUMBERED_ITEM_REGEX.exec(content)) !== null) {
    items.push({
      index: items.length + 1,
      label: match[1].trim(),
      fullText: match[2].trim(),
    })
  }

  if (items.length < 2) return null // need at least 2 items for a roadmap

  return { items }
}

// ─── Strippers ───

/** Strip markdown table lines (|...|) from content, preserving surrounding text */
export function stripMarkdownTable(content: string): string {
  return content
    .split('\n')
    .filter((l) => {
      const trimmed = l.trim()
      return !(trimmed.startsWith('|') && trimmed.endsWith('|'))
    })
    .join('\n')
    .trim()
}

/** Strip the first line matching a risk level keyword (e.g. "**Low**") */
export function stripRiskLevelLine(content: string): string {
  return content
    .split('\n')
    .filter((l) => !RISK_LEVEL_REGEX.test(l.trim()))
    .join('\n')
    .trim()
}

/** Strip numbered list items matching `N. **bold** — text` from content */
export function stripNumberedList(content: string): string {
  return content
    .split('\n')
    .filter((l) => !l.match(/^\d+\.\s+\*\*[^*]+\*\*\s*[—–-]\s*/))
    .join('\n')
    .trim()
}

// ─── Internal helpers ───

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1) // remove empty first/last from |...|
    .map((cell) => cell.trim())
}
