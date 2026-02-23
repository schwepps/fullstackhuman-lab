import { arrowheadPath } from '@/lib/visuals/geometry'
import { truncateLabel } from '@/lib/visuals/constants'
import type { RootCauseFlowData } from '@/lib/visuals/types'

const BOX_WIDTH = 170
const BOX_HEIGHT = 36
const ROW_GAP = 20
const ARROW_LENGTH = 60
const ARROW_Y_OFFSET = BOX_HEIGHT / 2
const PADDING_X = 16
const PADDING_Y = 12
const HEADER_HEIGHT = 20

interface RootCauseFlowProps {
  data: RootCauseFlowData
  accentHex: string
}

export function RootCauseFlow({ data, accentHex }: RootCauseFlowProps) {
  const rows = data.rows
  const totalHeight =
    PADDING_Y * 2 +
    HEADER_HEIGHT +
    rows.length * BOX_HEIGHT +
    (rows.length - 1) * ROW_GAP
  const totalWidth = PADDING_X * 2 + BOX_WIDTH * 2 + ARROW_LENGTH

  const leftX = PADDING_X
  const rightX = PADDING_X + BOX_WIDTH + ARROW_LENGTH

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="mx-auto w-full max-w-lg"
      role="img"
      aria-label="Symptoms and root causes flow diagram"
    >
      {/* Column headers */}
      <text
        x={leftX + BOX_WIDTH / 2}
        y={PADDING_Y - 2}
        textAnchor="middle"
        className="fill-gray-400 font-mono text-[10px] uppercase tracking-wider"
      >
        Symptom
      </text>
      <text
        x={rightX + BOX_WIDTH / 2}
        y={PADDING_Y - 2}
        textAnchor="middle"
        className="font-mono text-[10px] uppercase tracking-wider"
        fill={accentHex}
      >
        Root Cause
      </text>

      {rows.map((row, i) => {
        const y = PADDING_Y + HEADER_HEIGHT + i * (BOX_HEIGHT + ROW_GAP)
        const arrowStartX = leftX + BOX_WIDTH
        const arrowEndX = rightX
        const arrowY = y + ARROW_Y_OFFSET

        return (
          <g key={i}>
            {/* Symptom box */}
            <rect
              x={leftX}
              y={y}
              width={BOX_WIDTH}
              height={BOX_HEIGHT}
              rx={0}
              fill="#f9fafb"
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={leftX + BOX_WIDTH / 2}
              y={y + BOX_HEIGHT / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-gray-700 font-mono text-[10px]"
            >
              {truncateLabel(row.symptom, 26)}
            </text>

            {/* Arrow */}
            <line
              x1={arrowStartX + 4}
              y1={arrowY}
              x2={arrowEndX - 8}
              y2={arrowY}
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <path d={arrowheadPath(arrowEndX - 4, arrowY, 6)} fill="#9ca3af" />

            {/* Root cause box */}
            <rect
              x={rightX}
              y={y}
              width={BOX_WIDTH}
              height={BOX_HEIGHT}
              rx={0}
              fill={accentHex}
              fillOpacity={0.15}
              stroke={accentHex}
              strokeWidth={1}
              strokeOpacity={0.3}
            />
            <text
              x={rightX + BOX_WIDTH / 2}
              y={y + BOX_HEIGHT / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono text-[10px] font-medium"
              fill={accentHex}
            >
              {truncateLabel(row.rootCause, 26)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
