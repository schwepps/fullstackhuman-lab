import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { pdfStyles as s } from '@/lib/pdf/styles'
import { renderInline, renderTable } from '@/lib/pdf/pdf-inline-renderer'

/**
 * Convert a markdown string to react-pdf elements.
 * Handles: paragraphs, bold, italic, ordered/unordered lists,
 * blockquotes, tables, horizontal rules, links, inline code.
 *
 * This is a lightweight line-by-line parser — not a full AST.
 * Designed for the controlled markdown output of our report templates.
 */
export function MarkdownToPdf({
  content,
  accentHex,
  baseFontFamily,
}: {
  content: string
  accentHex: string
  baseFontFamily?: string
}) {
  const lines = content.split('\n')
  const elements: React.ReactElement[] = []
  let i = 0
  let key = 0
  const fontOverride = baseFontFamily
    ? { fontFamily: baseFontFamily }
    : undefined

  while (i < lines.length) {
    const line = lines[i]

    // Empty line — skip
    if (!line.trim()) {
      i++
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<View key={key++} style={s.hr} />)
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <View
          key={key++}
          style={[s.blockquote, { borderLeftColor: accentHex }]}
        >
          <Text
            style={fontOverride ? [s.paragraph, fontOverride] : s.paragraph}
          >
            {renderInline(quoteLines.join(' '), accentHex)}
          </Text>
        </View>
      )
      continue
    }

    // Table (starts with |)
    if (line.trimStart().startsWith('|') && line.trimEnd().endsWith('|')) {
      const tableLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trimStart().startsWith('|') &&
        lines[i].trimEnd().endsWith('|')
      ) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(renderTable(tableLines, accentHex, key++))
      continue
    }

    // Unordered list
    if (/^[-*] /.test(line.trimStart())) {
      while (i < lines.length && /^[-*] /.test(lines[i].trimStart())) {
        const text = lines[i].trimStart().replace(/^[-*] /, '')
        elements.push(
          <View key={key++} style={s.listItem}>
            <Text style={s.listBullet}>{'\u2022'}</Text>
            <Text
              style={
                fontOverride ? [s.listContent, fontOverride] : s.listContent
              }
            >
              {renderInline(text, accentHex)}
            </Text>
          </View>
        )
        i++
      }
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trimStart())) {
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
        const match = lines[i].trimStart().match(/^(\d+)\.\s(.*)/)
        if (match) {
          elements.push(
            <View key={key++} style={s.listItem}>
              <Text style={s.listBullet}>{match[1]}.</Text>
              <Text
                style={
                  fontOverride ? [s.listContent, fontOverride] : s.listContent
                }
              >
                {renderInline(match[2], accentHex)}
              </Text>
            </View>
          )
        }
        i++
      }
      continue
    }

    // Regular paragraph (collect until blank line or special line)
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('> ') &&
      !(
        lines[i].trimStart().startsWith('|') && lines[i].trimEnd().endsWith('|')
      ) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^[-*] /.test(lines[i].trimStart()) &&
      !/^\d+\.\s/.test(lines[i].trimStart())
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      elements.push(
        <Text
          key={key++}
          style={fontOverride ? [s.paragraph, fontOverride] : s.paragraph}
        >
          {renderInline(paraLines.join(' '), accentHex)}
        </Text>
      )
    }
  }

  return <>{elements}</>
}
