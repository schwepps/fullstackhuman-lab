import React from 'react'
import { Svg, Circle, Line, Text as SvgText } from '@react-pdf/renderer'
import { wrapSvgText } from '@/lib/visuals/constants'
import { computeRoadmapLayout } from '@/lib/visuals/geometry'
import type { PriorityRoadmapData } from '@/lib/visuals/types'

const SVG_WIDTH = 320
const CIRCLE_R = 12
const PADDING_X = 14
const PADDING_Y = 14
const TEXT_X = PADDING_X + CIRCLE_R * 2 + 14
const CIRCLE_CX = PADDING_X + CIRCLE_R
const LABEL_LINE_HEIGHT = 12
const SUBTITLE_LINE_HEIGHT = 10
const ROW_GAP = 24

const LAYOUT_CONFIG = {
  circleR: CIRCLE_R,
  paddingY: PADDING_Y,
  labelLineHeight: LABEL_LINE_HEIGHT,
  subtitleLineHeight: SUBTITLE_LINE_HEIGHT,
  labelMaxChars: 30,
  subtitleMaxChars: 34,
  rowGap: ROW_GAP,
} as const

export function PriorityRoadmapPdf({
  data,
  accentHex,
}: {
  data: PriorityRoadmapData
  accentHex: string
}) {
  const { items, totalHeight } = computeRoadmapLayout(
    data.items,
    LAYOUT_CONFIG,
    wrapSvgText
  )

  return (
    <Svg
      width={SVG_WIDTH}
      height={totalHeight}
      viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
    >
      {items.map((layout, i) => {
        const item = data.items[i]
        const { circleY, labelLines, subtitleLines } = layout

        // Top-align: first label line baseline aligns with circle center
        const labelStartY = circleY + LABEL_LINE_HEIGHT * 0.35

        return (
          <React.Fragment key={item.index}>
            {/* Vertical dashed connector to next */}
            {i < items.length - 1 && (
              <Line
                x1={CIRCLE_CX}
                y1={circleY + CIRCLE_R + 2}
                x2={CIRCLE_CX}
                y2={items[i + 1].circleY - CIRCLE_R - 2}
                stroke="#d1d5db"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
            )}

            {/* Circle */}
            <Circle
              cx={CIRCLE_CX}
              cy={circleY}
              r={CIRCLE_R}
              fill={i === 0 ? accentHex : 'white'}
              stroke={accentHex}
              strokeWidth={2}
            />

            {/* Number */}
            <SvgText
              x={CIRCLE_CX}
              y={circleY + 4}
              textAnchor="middle"
              style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}
              fill={i === 0 ? 'white' : accentHex}
            >
              {String(item.index)}
            </SvgText>

            {/* Label lines */}
            {labelLines.map((line, li) => (
              <SvgText
                key={`l-${i}-${li}`}
                x={TEXT_X}
                y={labelStartY + li * LABEL_LINE_HEIGHT}
                style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}
                fill="#374151"
              >
                {line}
              </SvgText>
            ))}

            {/* Subtitle lines (full text) */}
            {subtitleLines.map((line, li) => (
              <SvgText
                key={`s-${i}-${li}`}
                x={TEXT_X}
                y={
                  labelStartY +
                  labelLines.length * LABEL_LINE_HEIGHT +
                  4 +
                  li * SUBTITLE_LINE_HEIGHT
                }
                style={{ fontSize: 7, fontFamily: 'Helvetica' }}
                fill="#9ca3af"
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
