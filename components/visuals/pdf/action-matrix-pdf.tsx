import React from 'react'
import { Svg, Rect, Circle, Line, Text as SvgText } from '@react-pdf/renderer'
import { matrixDotPosition } from '@/lib/visuals/geometry'
import type { ActionMatrixData } from '@/lib/visuals/types'

const PLOT_X = 40
const PLOT_Y = 20
const PLOT_WIDTH = 260
const PLOT_HEIGHT = 240
const MAX_SCORE = 10
const DOT_R = 10

export function ActionMatrixPdf({
  data,
  accentHex,
}: {
  data: ActionMatrixData
  accentHex: string
}) {
  return (
    <Svg width="340" height="300" viewBox="0 0 340 300">
      {/* Background */}
      <Rect
        x={PLOT_X}
        y={PLOT_Y}
        width={PLOT_WIDTH}
        height={PLOT_HEIGHT}
        fill="#fafafa"
        stroke="#e5e7eb"
        strokeWidth={1}
      />
      {/* Quadrant dividers */}
      <Line
        x1={PLOT_X + PLOT_WIDTH / 2}
        y1={PLOT_Y}
        x2={PLOT_X + PLOT_WIDTH / 2}
        y2={PLOT_Y + PLOT_HEIGHT}
        stroke="#e5e7eb"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <Line
        x1={PLOT_X}
        y1={PLOT_Y + PLOT_HEIGHT / 2}
        x2={PLOT_X + PLOT_WIDTH}
        y2={PLOT_Y + PLOT_HEIGHT / 2}
        stroke="#e5e7eb"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {/* Axis labels */}
      <SvgText
        x={PLOT_X + PLOT_WIDTH / 2}
        y={PLOT_Y + PLOT_HEIGHT + 16}
        style={{ fontSize: 9, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        Urgency
      </SvgText>
      <SvgText
        x={PLOT_X - 28}
        y={PLOT_Y + PLOT_HEIGHT / 2}
        style={{ fontSize: 9, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        Impact
      </SvgText>
      {/* Action dots */}
      {data.actions.map((action) => {
        const pos = matrixDotPosition(
          PLOT_X,
          PLOT_Y,
          PLOT_WIDTH,
          PLOT_HEIGHT,
          action.impact,
          action.urgency,
          MAX_SCORE
        )
        return (
          <React.Fragment key={action.index}>
            <Circle
              cx={pos.x}
              cy={pos.y}
              r={DOT_R}
              fill={accentHex}
              fillOpacity={0.15}
              stroke={accentHex}
              strokeWidth={1.5}
            />
            <SvgText
              x={pos.x}
              y={pos.y + 3}
              style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}
              fill={accentHex}
            >
              {String(action.index)}
            </SvgText>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}
