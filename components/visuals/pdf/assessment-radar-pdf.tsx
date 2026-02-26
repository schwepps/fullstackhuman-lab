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
import { wrapSvgText } from '@/lib/visuals/constants'
import type { AssessmentRadarData } from '@/lib/visuals/types'

const CX = 280
const CY = 210
const OUTER_R = 130
const MAX_SCORE = 10
const GRID_RINGS = [2, 4, 6, 8, 10]
const LABEL_R = OUTER_R + 30
const LABEL_MAX_CHARS = 16
const LABEL_LINE_HEIGHT = 10

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
    <Svg width="560" height="440" viewBox="0 0 560 440">
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
        const isRight = labelPos.x > CX + 10
        const isLeft = labelPos.x < CX - 10
        const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle'

        // Push labels away from chart center to prevent overlap
        const isTop = labelPos.y < CY - 10
        const isBottom = labelPos.y > CY + 10
        const nameY = isTop
          ? labelPos.y - 10
          : isBottom
            ? labelPos.y + 2
            : labelPos.y - 4
        const scoreY = isTop
          ? labelPos.y + 2
          : isBottom
            ? labelPos.y + 14
            : labelPos.y + 8

        const nameLines = wrapSvgText(dim.name, LABEL_MAX_CHARS)
        const adjustedScoreY =
          scoreY + (nameLines.length - 1) * LABEL_LINE_HEIGHT

        return (
          <React.Fragment key={`label-${i}`}>
            {nameLines.map((line, li) => (
              <SvgText
                key={`name-${i}-${li}`}
                x={labelPos.x}
                y={nameY + li * LABEL_LINE_HEIGHT}
                textAnchor={anchor}
                style={{ fontSize: 8, fontFamily: 'Helvetica' }}
                fill="#4b5563"
              >
                {line}
              </SvgText>
            ))}
            <SvgText
              x={labelPos.x}
              y={adjustedScoreY}
              textAnchor={anchor}
              style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}
              fill={accentHex}
            >
              {`${dim.score}/10`}
            </SvgText>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}
