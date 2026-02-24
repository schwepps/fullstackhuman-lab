import { wrapSvgText } from '@/lib/visuals/constants'
import { computeRoadmapLayout } from '@/lib/visuals/geometry'
import type { PriorityRoadmapData } from '@/lib/visuals/types'

const SVG_WIDTH = 320
const CIRCLE_R = 14
const PADDING_X = 16
const PADDING_Y = 16
const TEXT_X = PADDING_X + CIRCLE_R * 2 + 16
const CIRCLE_CX = PADDING_X + CIRCLE_R
const LABEL_LINE_HEIGHT = 14
const SUBTITLE_LINE_HEIGHT = 12
const ROW_GAP = 32

const LAYOUT_CONFIG = {
  circleR: CIRCLE_R,
  paddingY: PADDING_Y,
  labelLineHeight: LABEL_LINE_HEIGHT,
  subtitleLineHeight: SUBTITLE_LINE_HEIGHT,
  labelMaxChars: 30,
  subtitleMaxChars: 34,
  rowGap: ROW_GAP,
} as const

interface PriorityRoadmapProps {
  data: PriorityRoadmapData
  accentHex: string
}

export function PriorityRoadmap({ data, accentHex }: PriorityRoadmapProps) {
  const { items, totalHeight } = computeRoadmapLayout(
    data.items,
    LAYOUT_CONFIG,
    wrapSvgText
  )

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label="Priority roadmap sequence"
    >
      {items.map((layout, i) => {
        const item = data.items[i]
        const { circleY, labelLines, subtitleLines } = layout

        // Top-align: first label line baseline aligns with circle center
        const labelStartY = circleY + LABEL_LINE_HEIGHT * 0.35

        return (
          <g key={item.index}>
            {/* Vertical dashed connector to next */}
            {i < items.length - 1 && (
              <line
                x1={CIRCLE_CX}
                y1={circleY + CIRCLE_R + 2}
                x2={CIRCLE_CX}
                y2={items[i + 1].circleY - CIRCLE_R - 2}
                stroke="#d1d5db"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            )}

            {/* Circle */}
            <circle
              cx={CIRCLE_CX}
              cy={circleY}
              r={CIRCLE_R}
              fill={i === 0 ? accentHex : 'white'}
              stroke={accentHex}
              strokeWidth={2}
            />

            {/* Number */}
            <text
              x={CIRCLE_CX}
              y={circleY + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono text-[11px] font-bold"
              fill={i === 0 ? 'white' : accentHex}
            >
              {item.index}
            </text>

            {/* Label lines (bold) */}
            <text
              textAnchor="start"
              className="fill-gray-700 font-mono text-[11px] font-semibold"
            >
              {labelLines.map((line, li) => (
                <tspan
                  key={li}
                  x={TEXT_X}
                  y={labelStartY + li * LABEL_LINE_HEIGHT}
                >
                  {line}
                </tspan>
              ))}
            </text>

            {/* Subtitle lines (muted, full text) */}
            <text
              textAnchor="start"
              className="fill-gray-400 font-mono text-[9px]"
            >
              {subtitleLines.map((line, li) => (
                <tspan
                  key={li}
                  x={TEXT_X}
                  y={
                    labelStartY +
                    labelLines.length * LABEL_LINE_HEIGHT +
                    4 +
                    li * SUBTITLE_LINE_HEIGHT
                  }
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
