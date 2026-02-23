import React from 'react'
import { Svg, Path, Circle, Line, Text as SvgText } from '@react-pdf/renderer'
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

const CX = 140
const CY = 130
const OUTER_R = 110
const INNER_R = 80
const NEEDLE_R = 95

export function RiskGaugePdf({ data }: { data: RiskGaugeData }) {
  const fraction = RISK_LEVEL_FRACTIONS[data.level] ?? 0.5
  const needleTip = gaugeNeedlePoint(CX, CY, NEEDLE_R, fraction)
  const segments = gaugeSegments()

  return (
    <Svg width="280" height="160" viewBox="0 0 280 160">
      {segments.map((seg) => (
        <Path
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
      {segments.map((seg) => {
        const midAngle = (seg.startAngle + seg.endAngle) / 2
        const labelPos = polarToCartesian(CX, CY, OUTER_R + 12, midAngle)
        return (
          <SvgText
            key={`label-${seg.level}`}
            x={labelPos.x}
            y={labelPos.y}
            style={{ fontSize: 7, fontFamily: 'Helvetica' }}
            fill="#9ca3af"
          >
            {GAUGE_LEVEL_LABELS[seg.level as RiskLevel]}
          </SvgText>
        )
      })}
      <Line
        x1={CX}
        y1={CY}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke="#1f2937"
        strokeWidth={2.5}
      />
      <Circle cx={CX} cy={CY} r={5} fill="#1f2937" />
      <SvgText
        x={CX}
        y={CY + 25}
        style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}
        fill={GAUGE_SEGMENT_COLORS[data.level]}
      >
        {GAUGE_LEVEL_LABELS[data.level]}
      </SvgText>
    </Svg>
  )
}
