import { matrixDotPosition } from '@/lib/visuals/geometry'
import { ACTION_MATRIX_QUADRANT_LABELS } from '@/lib/visuals/constants'
import type { ActionMatrixData } from '@/lib/visuals/types'

const PLOT_X = 40
const PLOT_Y = 20
const PLOT_WIDTH = 260
const PLOT_HEIGHT = 240
const MAX_SCORE = 10
const DOT_R = 12

const QUADRANT_POSITIONS = ACTION_MATRIX_QUADRANT_LABELS.map((label, i) => ({
  x: PLOT_X + PLOT_WIDTH * (i % 2 === 0 ? 0.25 : 0.75),
  y: PLOT_Y + PLOT_HEIGHT * (i < 2 ? 0.25 : 0.75),
  label,
}))

interface ActionPriorityMatrixProps {
  data: ActionMatrixData
  accentHex: string
}

export function ActionPriorityMatrix({
  data,
  accentHex,
}: ActionPriorityMatrixProps) {
  return (
    <svg
      viewBox="0 0 340 300"
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label="Action priority matrix plotting impact versus urgency"
    >
      {/* Grid background */}
      <rect
        x={PLOT_X}
        y={PLOT_Y}
        width={PLOT_WIDTH}
        height={PLOT_HEIGHT}
        fill="#fafafa"
        stroke="#e5e7eb"
        strokeWidth={1}
      />

      {/* Quadrant dividers */}
      <line
        x1={PLOT_X + PLOT_WIDTH / 2}
        y1={PLOT_Y}
        x2={PLOT_X + PLOT_WIDTH / 2}
        y2={PLOT_Y + PLOT_HEIGHT}
        stroke="#e5e7eb"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <line
        x1={PLOT_X}
        y1={PLOT_Y + PLOT_HEIGHT / 2}
        x2={PLOT_X + PLOT_WIDTH}
        y2={PLOT_Y + PLOT_HEIGHT / 2}
        stroke="#e5e7eb"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Quadrant labels */}
      {QUADRANT_POSITIONS.map((q) => (
        <text
          key={q.label}
          x={q.x}
          y={q.y}
          textAnchor="middle"
          className="fill-gray-300 font-mono text-[9px] uppercase tracking-wider"
        >
          {q.label}
        </text>
      ))}

      {/* Axis labels */}
      <text
        x={PLOT_X + PLOT_WIDTH / 2}
        y={PLOT_Y + PLOT_HEIGHT + 16}
        textAnchor="middle"
        className="fill-gray-500 font-mono text-[10px]"
      >
        Urgency →
      </text>
      <text
        x={PLOT_X - 10}
        y={PLOT_Y + PLOT_HEIGHT / 2}
        textAnchor="middle"
        transform={`rotate(-90, ${PLOT_X - 10}, ${PLOT_Y + PLOT_HEIGHT / 2})`}
        className="fill-gray-500 font-mono text-[10px]"
      >
        Impact →
      </text>

      {/* Action dots */}
      {data.actions.map((action) => {
        const pos = matrixDotPosition(
          PLOT_X,
          PLOT_Y,
          PLOT_WIDTH,
          PLOT_HEIGHT,
          action.impact,
          action.urgency,
          MAX_SCORE
        )
        return (
          <g key={action.index}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={DOT_R}
              fill={accentHex}
              fillOpacity={0.2}
              stroke={accentHex}
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono text-[10px] font-bold"
              fill={accentHex}
            >
              {action.index}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
