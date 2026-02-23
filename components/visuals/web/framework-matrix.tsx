import { quadrantBounds, frameworkUserPosition } from '@/lib/visuals/geometry'
import {
  FRAMEWORK_QUADRANT_FILLS,
  truncateLabel,
} from '@/lib/visuals/constants'
import type { FrameworkMatrixData } from '@/lib/visuals/types'

const PLOT_X = 50
const PLOT_Y = 30
const PLOT_WIDTH = 280
const PLOT_HEIGHT = 260

interface FrameworkMatrixProps {
  data: FrameworkMatrixData
  accentHex: string
}

export function FrameworkMatrix({ data, accentHex }: FrameworkMatrixProps) {
  const bounds = quadrantBounds(PLOT_X, PLOT_Y, PLOT_WIDTH, PLOT_HEIGHT)
  const quadrantEntries = [
    {
      key: 'topLeft' as const,
      bounds: bounds.topLeft,
      data: data.quadrants.topLeft,
    },
    {
      key: 'topRight' as const,
      bounds: bounds.topRight,
      data: data.quadrants.topRight,
    },
    {
      key: 'bottomLeft' as const,
      bounds: bounds.bottomLeft,
      data: data.quadrants.bottomLeft,
    },
    {
      key: 'bottomRight' as const,
      bounds: bounds.bottomRight,
      data: data.quadrants.bottomRight,
    },
  ]

  const userPos = data.userPosition
    ? frameworkUserPosition(
        PLOT_X,
        PLOT_Y,
        PLOT_WIDTH,
        PLOT_HEIGHT,
        data.userPosition.x,
        data.userPosition.y
      )
    : null

  return (
    <svg
      viewBox="0 0 380 340"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label={`Framework matrix: ${data.title}`}
    >
      {/* Title */}
      <text
        x={PLOT_X + PLOT_WIDTH / 2}
        y={16}
        textAnchor="middle"
        className="fill-gray-700 font-mono text-[11px] font-semibold"
      >
        {data.title}
      </text>

      {/* Quadrant fills */}
      {quadrantEntries.map((q) => (
        <rect
          key={q.key}
          x={q.bounds.x}
          y={q.bounds.y}
          width={q.bounds.width}
          height={q.bounds.height}
          fill={FRAMEWORK_QUADRANT_FILLS[q.key]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      ))}

      {/* Quadrant labels + descriptions */}
      {quadrantEntries.map((q) => (
        <g key={`label-${q.key}`}>
          <text
            x={q.bounds.centerX}
            y={q.bounds.centerY - 6}
            textAnchor="middle"
            className="fill-gray-700 font-mono text-[10px] font-semibold"
          >
            {truncateLabel(q.data.label, 20)}
          </text>
          <text
            x={q.bounds.centerX}
            y={q.bounds.centerY + 8}
            textAnchor="middle"
            className="fill-gray-400 font-mono text-[8px]"
          >
            {truncateLabel(q.data.description, 28)}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      <text
        x={PLOT_X + PLOT_WIDTH / 2}
        y={PLOT_Y + PLOT_HEIGHT + 16}
        textAnchor="middle"
        className="fill-gray-500 font-mono text-[9px]"
      >
        {data.xAxisLabel}
      </text>
      <text
        x={PLOT_X - 4}
        y={PLOT_Y + PLOT_HEIGHT + 16}
        textAnchor="start"
        className="fill-gray-400 font-mono text-[8px]"
      >
        {data.xAxisLow}
      </text>
      <text
        x={PLOT_X + PLOT_WIDTH + 4}
        y={PLOT_Y + PLOT_HEIGHT + 16}
        textAnchor="end"
        className="fill-gray-400 font-mono text-[8px]"
      >
        {data.xAxisHigh}
      </text>

      {/* Y-axis */}
      <text
        x={PLOT_X - 8}
        y={PLOT_Y + PLOT_HEIGHT / 2}
        textAnchor="middle"
        transform={`rotate(-90, ${PLOT_X - 8}, ${PLOT_Y + PLOT_HEIGHT / 2})`}
        className="fill-gray-500 font-mono text-[9px]"
      >
        {data.yAxisLabel}
      </text>
      <text
        x={PLOT_X - 8}
        y={PLOT_Y + PLOT_HEIGHT + 4}
        textAnchor="middle"
        transform={`rotate(-90, ${PLOT_X - 8}, ${PLOT_Y + PLOT_HEIGHT + 4})`}
        className="fill-gray-400 font-mono text-[8px]"
      >
        {data.yAxisLow}
      </text>
      <text
        x={PLOT_X - 8}
        y={PLOT_Y - 4}
        textAnchor="middle"
        transform={`rotate(-90, ${PLOT_X - 8}, ${PLOT_Y - 4})`}
        className="fill-gray-400 font-mono text-[8px]"
      >
        {data.yAxisHigh}
      </text>

      {/* User position dot */}
      {userPos && (
        <g>
          <circle
            cx={userPos.x}
            cy={userPos.y}
            r={8}
            fill={accentHex}
            fillOpacity={0.2}
            stroke={accentHex}
            strokeWidth={2}
          />
          <circle cx={userPos.x} cy={userPos.y} r={3} fill={accentHex} />
          <text
            x={userPos.x}
            y={userPos.y - 14}
            textAnchor="middle"
            className="font-mono text-[9px] font-bold"
            fill={accentHex}
          >
            You
          </text>
        </g>
      )}
    </svg>
  )
}
