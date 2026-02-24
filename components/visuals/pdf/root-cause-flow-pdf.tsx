import React from 'react'
import { Svg, Rect, Line, Path, Text as SvgText } from '@react-pdf/renderer'
import { arrowheadPath } from '@/lib/visuals/geometry'
import { wrapSvgText } from '@/lib/visuals/constants'
import type { RootCauseFlowData } from '@/lib/visuals/types'

const BOX_W = 200
const BOX_MIN_H = 32
const BOX_PADDING_Y = 8
const LINE_HEIGHT = 11
const GAP = 18
const ARROW_LEN = 50
const PAD_X = 12
const PAD_Y = 12
const HEADER_HEIGHT = 18
const MAX_CHARS = 30

function computeBoxHeight(lineCount: number): number {
  return Math.max(BOX_MIN_H, BOX_PADDING_Y * 2 + lineCount * LINE_HEIGHT)
}

interface RowLayout {
  y: number
  height: number
  symptomLines: string[]
  causeLines: string[]
}

function computeLayout(data: RootCauseFlowData): {
  rows: RowLayout[]
  totalHeight: number
} {
  const layouts: RowLayout[] = []
  let y = PAD_Y + HEADER_HEIGHT

  for (const row of data.rows) {
    const symptomLines = wrapSvgText(row.symptom, MAX_CHARS)
    const causeLines = wrapSvgText(row.rootCause, MAX_CHARS)
    const height = Math.max(
      computeBoxHeight(symptomLines.length),
      computeBoxHeight(causeLines.length)
    )

    layouts.push({ y, height, symptomLines, causeLines })
    y += height + GAP
  }

  return { rows: layouts, totalHeight: y - GAP + PAD_Y }
}

export function RootCauseFlowPdf({
  data,
  accentHex,
}: {
  data: RootCauseFlowData
  accentHex: string
}) {
  const { rows, totalHeight } = computeLayout(data)
  const totalWidth = PAD_X * 2 + BOX_W * 2 + ARROW_LEN
  const leftX = PAD_X
  const rightX = PAD_X + BOX_W + ARROW_LEN

  return (
    <Svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
    >
      {/* Column headers */}
      <SvgText
        x={leftX + BOX_W / 2}
        y={PAD_Y + 8}
        style={{ fontSize: 7, fontFamily: 'Helvetica' }}
        fill="#9ca3af"
      >
        SYMPTOM
      </SvgText>
      <SvgText
        x={rightX + BOX_W / 2}
        y={PAD_Y + 8}
        style={{ fontSize: 7, fontFamily: 'Helvetica' }}
        fill={accentHex}
      >
        ROOT CAUSE
      </SvgText>

      {rows.map((row, i) => {
        const { y, height, symptomLines, causeLines } = row
        const arrStart = leftX + BOX_W + 4
        const arrEnd = rightX - 4
        const arrY = y + height / 2

        return (
          <React.Fragment key={i}>
            {/* Symptom box */}
            <Rect
              x={leftX}
              y={y}
              width={BOX_W}
              height={height}
              fill="#f9fafb"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            {symptomLines.map((line, li) => (
              <SvgText
                key={`s-${i}-${li}`}
                x={leftX + BOX_W / 2}
                y={
                  y +
                  (height - symptomLines.length * LINE_HEIGHT) / 2 +
                  LINE_HEIGHT * 0.75 +
                  li * LINE_HEIGHT
                }
                style={{ fontSize: 8, fontFamily: 'Helvetica' }}
                fill="#374151"
              >
                {line}
              </SvgText>
            ))}

            {/* Arrow */}
            <Line
              x1={arrStart}
              y1={arrY}
              x2={arrEnd - 6}
              y2={arrY}
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <Path d={arrowheadPath(arrEnd, arrY, 5)} fill="#9ca3af" />

            {/* Root cause box */}
            <Rect
              x={rightX}
              y={y}
              width={BOX_W}
              height={height}
              fill={accentHex}
              fillOpacity={0.08}
              stroke={accentHex}
              strokeWidth={1}
              strokeOpacity={0.3}
            />
            {causeLines.map((line, li) => (
              <SvgText
                key={`c-${i}-${li}`}
                x={rightX + BOX_W / 2}
                y={
                  y +
                  (height - causeLines.length * LINE_HEIGHT) / 2 +
                  LINE_HEIGHT * 0.75 +
                  li * LINE_HEIGHT
                }
                style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}
                fill={accentHex}
              >
                {line}
              </SvgText>
            ))}
          </React.Fragment>
        )
      })}
    </Svg>
  )
}
