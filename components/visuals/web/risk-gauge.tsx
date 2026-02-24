import {
  donutArcPath,
  gaugeNeedlePoint,
  gaugeSegments,
  RISK_LEVEL_FRACTIONS,
  polarToCartesian,
} from '@/lib/visuals/geometry'
import {
  GAUGE_SEGMENT_COLORS,
  GAUGE_LEVEL_LABELS,
} from '@/lib/visuals/constants'
import type { RiskGaugeData, RiskLevel } from '@/lib/visuals/types'

const CX = 160
const CY = 130
const OUTER_R = 110
const INNER_R = 80
const NEEDLE_R = 95

interface RiskGaugeProps {
  data: RiskGaugeData
}

export function RiskGauge({ data }: RiskGaugeProps) {
  const fraction = RISK_LEVEL_FRACTIONS[data.level] ?? 0.5
  const needleTip = gaugeNeedlePoint(CX, CY, NEEDLE_R, fraction)
  const segments = gaugeSegments()

  return (
    <svg
      viewBox="0 0 330 160"
      className="mx-auto w-full max-w-[330px]"
      role="img"
      aria-label={`Risk level: ${GAUGE_LEVEL_LABELS[data.level]}`}
    >
      {/* Gauge segments */}
      {segments.map((seg) => (
        <path
          key={seg.level}
          d={donutArcPath(
            CX,
            CY,
            OUTER_R,
            INNER_R,
            seg.startAngle,
            seg.endAngle
          )}
          fill={GAUGE_SEGMENT_COLORS[seg.level]}
          opacity={seg.level === data.level ? 1 : 0.25}
        />
      ))}

      {/* Segment labels */}
      {segments.map((seg) => {
        const midAngle = (seg.startAngle + seg.endAngle) / 2
        const labelPos = polarToCartesian(CX, CY, OUTER_R + 14, midAngle)
        const isRight = labelPos.x > CX + 10
        const isLeft = labelPos.x < CX - 10
        const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle'
        return (
          <text
            key={`label-${seg.level}`}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor={anchor}
            className="fill-gray-400 font-mono text-[9px]"
          >
            {GAUGE_LEVEL_LABELS[seg.level as RiskLevel]}
          </text>
        )
      })}

      {/* Needle */}
      <line
        x1={CX}
        y1={CY}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke="#1f2937"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={5} fill="#1f2937" />

      {/* Level label */}
      <text
        x={CX}
        y={CY + 25}
        textAnchor="middle"
        className="font-mono text-xs font-semibold"
        fill={GAUGE_SEGMENT_COLORS[data.level]}
      >
        {GAUGE_LEVEL_LABELS[data.level]}
      </text>
    </svg>
  )
}
