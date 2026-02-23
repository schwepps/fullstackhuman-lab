import React from 'react'
import { Svg, Circle, Line, Text as SvgText } from '@react-pdf/renderer'
import type { PriorityRoadmapData } from '@/lib/visuals/types'

const R = 14
const GAP = 70
const PAD = 24
const CY = PAD + R

export function PriorityRoadmapPdf({
  data,
  accentHex,
}: {
  data: PriorityRoadmapData
  accentHex: string
}) {
  const items = data.items
  const w = PAD * 2 + (items.length - 1) * GAP + R * 2

  return (
    <Svg width={w} height="90" viewBox={`0 0 ${w} 90`}>
      {items.map((item, i) => {
        const cx = PAD + R + i * GAP
        return (
          <React.Fragment key={item.index}>
            {i < items.length - 1 && (
              <Line
                x1={cx + R + 4}
                y1={CY}
                x2={cx + GAP - R - 4}
                y2={CY}
                stroke="#d1d5db"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
            )}
            <Circle
              cx={cx}
              cy={CY}
              r={R}
              fill={i === 0 ? accentHex : 'white'}
              stroke={accentHex}
              strokeWidth={2}
            />
            <SvgText
              x={cx}
              y={CY + 3}
              style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}
              fill={i === 0 ? 'white' : accentHex}
            >
              {String(item.index)}
            </SvgText>
            <SvgText
              x={cx}
              y={CY + 28}
              style={{ fontSize: 7, fontFamily: 'Helvetica' }}
              fill="#4b5563"
            >
              {truncate(item.label, 12)}
            </SvgText>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}
