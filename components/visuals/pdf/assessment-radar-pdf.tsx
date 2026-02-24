import React from 'react'
import {
  Svg,
  Polygon,
  Circle,
  Line,
  Text as SvgText,
} from '@react-pdf/renderer'
import {
  radarPolygonPoints,
  radarGridPoints,
  pointsToSvgString,
  polarToCartesian,
} from '@/lib/visuals/geometry'
import type { AssessmentRadarData } from '@/lib/visuals/types'

const CX = 250
const CY = 195
const OUTER_R = 130
const MAX_SCORE = 10
const GRID_RINGS = [2, 4, 6, 8, 10]
const LABEL_R = OUTER_R + 22

export function AssessmentRadarPdf({
  data,
  accentHex,
}: {
  data: AssessmentRadarData
  accentHex: string
}) {
  const n = data.dimensions.length
  const scores = data.dimensions.map((d) => d.score)
  const scorePoints = radarPolygonPoints(CX, CY, scores, MAX_SCORE, OUTER_R)
  const outerPoints = radarGridPoints(CX, CY, OUTER_R, n)

  return (
    <Svg width="500" height="400" viewBox="0 0 500 400">
      {/* Grid rings */}
      {GRID_RINGS.map((ring) => {
        const r = (ring / MAX_SCORE) * OUTER_R
        const ringPoints = radarGridPoints(CX, CY, r, n)
        return (
          <Polygon
            key={ring}
            points={pointsToSvgString(ringPoints)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={ring === MAX_SCORE ? 1 : 0.5}
          />
        )
      })}
      {/* Axis lines */}
      {outerPoints.map((point, i) => (
        <Line
          key={`axis-${i}`}
          x1={CX}
          y1={CY}
          x2={point.x}
          y2={point.y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      ))}
      {/* Score polygon */}
      <Polygon
        points={pointsToSvgString(scorePoints)}
        fill={accentHex}
        fillOpacity={0.12}
        stroke={accentHex}
        strokeWidth={2}
      />
      {/* Score dots */}
      {scorePoints.map((point, i) => (
        <Circle
          key={`dot-${i}`}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={accentHex}
        />
      ))}
      {/* Labels */}
      {data.dimensions.map((dim, i) => {
        const angle = (i * 360) / n
        const labelPos = polarToCartesian(CX, CY, LABEL_R, angle)
        return (
          <SvgText
            key={`label-${i}`}
            x={labelPos.x}
            y={labelPos.y}
            style={{ fontSize: 8, fontFamily: 'Helvetica' }}
            fill="#4b5563"
          >
            {dim.name} ({dim.score}/10)
          </SvgText>
        )
      })}
    </Svg>
  )
}
