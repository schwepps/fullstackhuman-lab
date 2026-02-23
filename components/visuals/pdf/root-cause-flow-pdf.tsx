import React from 'react'
import { Svg, Rect, Line, Path, Text as SvgText } from '@react-pdf/renderer'
import { arrowheadPath } from '@/lib/visuals/geometry'
import { truncateLabel } from '@/lib/visuals/constants'
import type { RootCauseFlowData } from '@/lib/visuals/types'

const BOX_W = 160
const BOX_H = 32
const GAP = 10
const ARROW_LEN = 50
const PAD = 12

export function RootCauseFlowPdf({
  data,
  accentHex,
}: {
  data: RootCauseFlowData
  accentHex: string
}) {
  const rows = data.rows
  const h = PAD * 2 + rows.length * BOX_H + (rows.length - 1) * GAP
  const w = PAD * 2 + BOX_W * 2 + ARROW_LEN
  const leftX = PAD
  const rightX = PAD + BOX_W + ARROW_LEN

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {rows.map((row, i) => {
        const y = PAD + i * (BOX_H + GAP)
        const arrStart = leftX + BOX_W + 4
        const arrEnd = rightX - 4
        const arrY = y + BOX_H / 2

        return (
          <React.Fragment key={i}>
            {/* Symptom box */}
            <Rect
              x={leftX}
              y={y}
              width={BOX_W}
              height={BOX_H}
              fill="#f9fafb"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <SvgText
              x={leftX + BOX_W / 2}
              y={y + BOX_H / 2 + 3}
              style={{ fontSize: 8, fontFamily: 'Helvetica' }}
              fill="#374151"
            >
              {truncateLabel(row.symptom, 24)}
            </SvgText>
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
              height={BOX_H}
              fill={accentHex}
              fillOpacity={0.08}
              stroke={accentHex}
              strokeWidth={1}
              strokeOpacity={0.3}
            />
            <SvgText
              x={rightX + BOX_W / 2}
              y={y + BOX_H / 2 + 3}
              style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}
              fill={accentHex}
            >
              {truncateLabel(row.rootCause, 24)}
            </SvgText>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}
