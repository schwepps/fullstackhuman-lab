import React from 'react'
import { Text, View, Link } from '@react-pdf/renderer'
import { pdfStyles as s } from '@/lib/pdf/styles'

// ─── Inline rendering ───

export function renderInline(
  text: string,
  accentHex: string
): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = []
  // Match: **bold**, *italic*, _italic_, `code`, [text](url)
  const regex =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      parts.push(
        <Text key={key++} style={[s.strong, { color: accentHex }]}>
          {match[2]}
        </Text>
      )
    } else if (match[4]) {
      // *italic*
      parts.push(
        <Text key={key++} style={s.italic}>
          {match[4]}
        </Text>
      )
    } else if (match[6]) {
      // _italic_
      parts.push(
        <Text key={key++} style={s.italic}>
          {match[6]}
        </Text>
      )
    } else if (match[8]) {
      // `code`
      parts.push(
        <Text key={key++} style={s.codeInline}>
          {match[8]}
        </Text>
      )
    } else if (match[10] && match[11]) {
      // [text](url)
      if (/^https?:\/\//i.test(match[11])) {
        parts.push(
          <Link
            key={key++}
            src={match[11]}
            style={[s.link, { color: accentHex }]}
          >
            {match[10]}
          </Link>
        )
      } else {
        parts.push(match[10])
      }
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

// ─── Table rendering ───

export function renderTable(
  lines: string[],
  accentHex: string,
  tableKey: number
): React.ReactElement {
  const parsedRows = lines
    .filter((line) => !/^[|\s-:]+$/.test(line.trim())) // Remove separator
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    )

  if (parsedRows.length === 0) {
    return <View key={tableKey} />
  }

  const headerRow = parsedRows[0]
  const dataRows = parsedRows.slice(1)

  return (
    <View key={tableKey} style={s.table}>
      {/* Header */}
      <View style={[s.tableHeader, { backgroundColor: `${accentHex}10` }]}>
        {headerRow.map((cell, ci) => (
          <Text key={ci} style={s.tableHeaderCell}>
            {cell}
          </Text>
        ))}
      </View>
      {/* Data rows */}
      {dataRows.map((row, ri) => (
        <View key={ri} style={s.tableRow}>
          {row.map((cell, ci) => (
            <Text key={ci} style={s.tableCell}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}
