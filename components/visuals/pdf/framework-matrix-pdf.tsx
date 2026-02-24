import React from 'react'
import { Svg, Rect, Circle, Text as SvgText } from '@react-pdf/renderer'
import { quadrantBounds, frameworkUserPosition } from '@/lib/visuals/geometry'
import { FRAMEWORK_QUADRANT_FILLS, wrapSvgText } from '@/lib/visuals/constants'
import type { FrameworkMatrixData } from '@/lib/visuals/types'

const PX = 120
const PY = 36
const PW = 384
const PH = 336
const DESC_LINE_HEIGHT = 12
const DESC_MAX_CHARS = 26
const YAXIS_LABEL_MAX_CHARS = 18
const YAXIS_LABEL_LINE_HEIGHT = 12

export function FrameworkMatrixPdf({
  data,
  accentHex,
}: {
  data: FrameworkMatrixData
  accentHex: string
}) {
  const bounds = quadrantBounds(PX, PY, PW, PH)
  const quads = [
    { key: 'topLeft' as const, b: bounds.topLeft, d: data.quadrants.topLeft },
    {
      key: 'topRight' as const,
      b: bounds.topRight,
      d: data.quadrants.topRight,
    },
    {
      key: 'bottomLeft' as const,
      b: bounds.bottomLeft,
      d: data.quadrants.bottomLeft,
    },
    {
      key: 'bottomRight' as const,
      b: bounds.bottomRight,
      d: data.quadrants.bottomRight,
    },
  ]

  const userPos = data.userPosition
    ? frameworkUserPosition(
        PX,
        PY,
        PW,
        PH,
        data.userPosition.x,
        data.userPosition.y
      )
    : null

  const yAxisLines = wrapSvgText(data.yAxisLabel, YAXIS_LABEL_MAX_CHARS)

  return (
    <Svg width="580" height="440" viewBox="0 0 580 440">
      {/* Title */}
      <SvgText
        x={PX + PW / 2}
        y={16}
        style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}
        fill="#374151"
      >
        {data.title}
      </SvgText>

      {/* Quadrants */}
      {quads.map((q) => {
        const descLines = wrapSvgText(q.d.description, DESC_MAX_CHARS)
        return (
          <React.Fragment key={q.key}>
            <Rect
              x={q.b.x}
              y={q.b.y}
              width={q.b.width}
              height={q.b.height}
              fill={FRAMEWORK_QUADRANT_FILLS[q.key]}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
            <SvgText
              x={q.b.centerX}
              y={q.b.centerY - 8}
              style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}
              fill="#374151"
            >
              {q.d.label}
            </SvgText>
            {descLines.map((line, li) => (
              <SvgText
                key={`d-${q.key}-${li}`}
                x={q.b.centerX}
                y={q.b.centerY + 6 + li * DESC_LINE_HEIGHT}
                style={{ fontSize: 8, fontFamily: 'Helvetica' }}
                fill="#9ca3af"
              >
                {line}
              </SvgText>
            ))}
          </React.Fragment>
        )
      })}

      {/* X-axis label */}
      <SvgText
        x={PX + PW / 2}
        y={PY + PH + 16}
        style={{ fontSize: 9, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        {data.xAxisLabel}
      </SvgText>
      {/* X-axis low */}
      <SvgText
        x={PX}
        y={PY + PH + 28}
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#9ca3af"
      >
        {data.xAxisLow}
      </SvgText>
      {/* X-axis high */}
      <SvgText
        x={PX + PW}
        y={PY + PH + 28}
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#9ca3af"
      >
        {data.xAxisHigh}
      </SvgText>

      {/* Y-axis label (horizontal, left of plot) */}
      {yAxisLines.map((line, li) => (
        <SvgText
          key={`ya-${li}`}
          x={PX - 8}
          y={
            PY +
            PH / 2 -
            ((yAxisLines.length - 1) * YAXIS_LABEL_LINE_HEIGHT) / 2 +
            li * YAXIS_LABEL_LINE_HEIGHT
          }
          style={{ fontSize: 8, fontFamily: 'Helvetica' }}
          fill="#6b7280"
        >
          {line}
        </SvgText>
      ))}
      {/* Y-axis low */}
      <SvgText
        x={PX - 8}
        y={PY + PH - 4}
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#9ca3af"
      >
        {data.yAxisLow}
      </SvgText>
      {/* Y-axis high */}
      <SvgText
        x={PX - 8}
        y={PY + 10}
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#9ca3af"
      >
        {data.yAxisHigh}
      </SvgText>

      {/* User dot */}
      {userPos && (
        <>
          <Circle
            cx={userPos.x}
            cy={userPos.y}
            r={14}
            fill={accentHex}
            fillOpacity={0.2}
            stroke={accentHex}
            strokeWidth={2.5}
          />
          <Circle cx={userPos.x} cy={userPos.y} r={6} fill={accentHex} />
          <SvgText
            x={userPos.x}
            y={userPos.y - 20}
            style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}
            fill={accentHex}
          >
            You
          </SvgText>
        </>
      )}
    </Svg>
  )
}
