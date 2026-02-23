import React from 'react'
import { Svg, Rect, Circle, Text as SvgText } from '@react-pdf/renderer'
import { quadrantBounds, frameworkUserPosition } from '@/lib/visuals/geometry'
import type { FrameworkMatrixData } from '@/lib/visuals/types'

const PX = 40
const PY = 24
const PW = 280
const PH = 260

const Q_FILLS: Record<string, string> = {
  topLeft: '#f0fdf4',
  topRight: '#ecfdf5',
  bottomLeft: '#fafafa',
  bottomRight: '#fefce8',
}

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

  return (
    <Svg width="380" height="320" viewBox="0 0 380 320">
      {/* Title */}
      <SvgText
        x={PX + PW / 2}
        y={14}
        style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}
        fill="#374151"
      >
        {data.title}
      </SvgText>
      {/* Quadrants */}
      {quads.map((q) => (
        <React.Fragment key={q.key}>
          <Rect
            x={q.b.x}
            y={q.b.y}
            width={q.b.width}
            height={q.b.height}
            fill={Q_FILLS[q.key]}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
          <SvgText
            x={q.b.centerX}
            y={q.b.centerY - 4}
            style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}
            fill="#374151"
          >
            {q.d.label}
          </SvgText>
          <SvgText
            x={q.b.centerX}
            y={q.b.centerY + 8}
            style={{ fontSize: 7, fontFamily: 'Helvetica' }}
            fill="#9ca3af"
          >
            {truncate(q.d.description, 28)}
          </SvgText>
        </React.Fragment>
      ))}
      {/* Axis labels */}
      <SvgText
        x={PX + PW / 2}
        y={PY + PH + 14}
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        {data.xAxisLabel}
      </SvgText>
      <SvgText
        x={PX - 6}
        y={PY + PH / 2}
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        {data.yAxisLabel}
      </SvgText>
      {/* User dot */}
      {userPos && (
        <>
          <Circle
            cx={userPos.x}
            cy={userPos.y}
            r={7}
            fill={accentHex}
            fillOpacity={0.2}
            stroke={accentHex}
            strokeWidth={2}
          />
          <Circle cx={userPos.x} cy={userPos.y} r={3} fill={accentHex} />
        </>
      )}
    </Svg>
  )
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}
