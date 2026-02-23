import { truncateLabel } from '@/lib/visuals/constants'
import type { PriorityRoadmapData } from '@/lib/visuals/types'

const CIRCLE_R = 16
const CIRCLE_GAP = 80
const PADDING_X = 30
const PADDING_Y = 20
const LABEL_Y_OFFSET = 32

interface PriorityRoadmapProps {
  data: PriorityRoadmapData
  accentHex: string
}

export function PriorityRoadmap({ data, accentHex }: PriorityRoadmapProps) {
  const items = data.items
  const totalWidth =
    PADDING_X * 2 + (items.length - 1) * CIRCLE_GAP + CIRCLE_R * 2
  const cy = PADDING_Y + CIRCLE_R

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 100`}
      className="mx-auto w-full max-w-lg"
      role="img"
      aria-label="Priority roadmap sequence"
    >
      {items.map((item, i) => {
        const cx = PADDING_X + CIRCLE_R + i * CIRCLE_GAP

        return (
          <g key={item.index}>
            {/* Connector dashed line to next */}
            {i < items.length - 1 && (
              <line
                x1={cx + CIRCLE_R + 4}
                y1={cy}
                x2={cx + CIRCLE_GAP - CIRCLE_R - 4}
                y2={cy}
                stroke="#d1d5db"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            )}

            {/* Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={CIRCLE_R}
              fill={i === 0 ? accentHex : 'white'}
              stroke={accentHex}
              strokeWidth={2}
            />

            {/* Number */}
            <text
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono text-[11px] font-bold"
              fill={i === 0 ? 'white' : accentHex}
            >
              {item.index}
            </text>

            {/* Label below */}
            <text
              x={cx}
              y={cy + LABEL_Y_OFFSET}
              textAnchor="middle"
              className="fill-gray-600 font-mono text-[9px]"
            >
              {truncateLabel(item.label, 18)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
