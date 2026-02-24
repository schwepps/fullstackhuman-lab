import {
  radarPolygonPoints,
  radarGridPoints,
  pointsToSvgString,
  polarToCartesian,
} from '@/lib/visuals/geometry'
import type { AssessmentRadarData } from '@/lib/visuals/types'

const CX = 250
const CY = 200
const OUTER_R = 130
const MAX_SCORE = 10
const GRID_RINGS = [2, 4, 6, 8, 10]
const LABEL_R = OUTER_R + 30

interface AssessmentRadarProps {
  data: AssessmentRadarData
  accentHex: string
}

export function AssessmentRadar({ data, accentHex }: AssessmentRadarProps) {
  const n = data.dimensions.length
  const scores = data.dimensions.map((d) => d.score)
  const scorePoints = radarPolygonPoints(CX, CY, scores, MAX_SCORE, OUTER_R)
  const outerPoints = radarGridPoints(CX, CY, OUTER_R, n)

  return (
    <svg
      viewBox="0 0 500 420"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label="Assessment radar chart"
    >
      {/* Grid rings */}
      {GRID_RINGS.map((ring) => {
        const r = (ring / MAX_SCORE) * OUTER_R
        const ringPoints = radarGridPoints(CX, CY, r, n)
        return (
          <polygon
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
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={point.x}
          y2={point.y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      ))}

      {/* Score polygon */}
      <polygon
        points={pointsToSvgString(scorePoints)}
        fill={accentHex}
        fillOpacity={0.2}
        stroke={accentHex}
        strokeWidth={2}
      />

      {/* Score dots */}
      {scorePoints.map((point, i) => (
        <circle key={i} cx={point.x} cy={point.y} r={4} fill={accentHex} />
      ))}

      {/* Dimension labels */}
      {data.dimensions.map((dim, i) => {
        const angle = (i * 360) / n
        const labelPos = polarToCartesian(CX, CY, LABEL_R, angle)
        const isRight = labelPos.x > CX + 10
        const isLeft = labelPos.x < CX - 10
        const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle'

        return (
          <g key={i}>
            <text
              x={labelPos.x}
              y={labelPos.y - 4}
              textAnchor={anchor}
              className="fill-gray-600 font-mono text-[12px]"
            >
              {dim.name}
            </text>
            <text
              x={labelPos.x}
              y={labelPos.y + 8}
              textAnchor={anchor}
              className="font-mono text-[12px] font-bold"
              fill={accentHex}
            >
              {dim.score}/10
            </text>
          </g>
        )
      })}
    </svg>
  )
}
