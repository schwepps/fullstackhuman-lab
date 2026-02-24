import { quadrantBounds, frameworkUserPosition } from '@/lib/visuals/geometry'
import { FRAMEWORK_QUADRANT_FILLS, wrapSvgText } from '@/lib/visuals/constants'
import type { FrameworkMatrixData } from '@/lib/visuals/types'

const PLOT_X = 140
const PLOT_Y = 44
const PLOT_WIDTH = 408
const PLOT_HEIGHT = 360
const DESC_LINE_HEIGHT = 14
const DESC_MAX_CHARS = 26
const YAXIS_LABEL_MAX_CHARS = 18
const YAXIS_LABEL_LINE_HEIGHT = 13

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

  const yAxisLines = wrapSvgText(data.yAxisLabel, YAXIS_LABEL_MAX_CHARS)

  return (
    <svg
      viewBox="0 0 620 470"
      className="mx-auto w-full max-w-xl"
      role="img"
      aria-label={`Framework matrix: ${data.title}`}
    >
      {/* Title */}
      <text
        x={PLOT_X + PLOT_WIDTH / 2}
        y={18}
        textAnchor="middle"
        className="fill-gray-700 font-mono text-sm font-semibold"
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

      {/* Quadrant labels + descriptions (multi-line) */}
      {quadrantEntries.map((q) => {
        const descLines = wrapSvgText(q.data.description, DESC_MAX_CHARS)
        return (
          <g key={`label-${q.key}`}>
            <text
              x={q.bounds.centerX}
              y={q.bounds.centerY - 10}
              textAnchor="middle"
              className="fill-gray-700 font-mono text-[13px] font-semibold"
            >
              {q.data.label}
            </text>
            <text
              textAnchor="middle"
              className="fill-gray-400 font-mono text-[11px]"
            >
              {descLines.map((line, li) => (
                <tspan
                  key={li}
                  x={q.bounds.centerX}
                  y={q.bounds.centerY + 6 + li * DESC_LINE_HEIGHT}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}

      {/* X-axis label (centered below plot) */}
      <text
        x={PLOT_X + PLOT_WIDTH / 2}
        y={PLOT_Y + PLOT_HEIGHT + 22}
        textAnchor="middle"
        className="fill-gray-500 font-mono text-[12px]"
      >
        {data.xAxisLabel}
      </text>
      {/* X-axis low */}
      <text
        x={PLOT_X}
        y={PLOT_Y + PLOT_HEIGHT + 38}
        textAnchor="start"
        className="fill-gray-400 font-mono text-[11px]"
      >
        {data.xAxisLow}
      </text>
      {/* X-axis high */}
      <text
        x={PLOT_X + PLOT_WIDTH}
        y={PLOT_Y + PLOT_HEIGHT + 38}
        textAnchor="end"
        className="fill-gray-400 font-mono text-[11px]"
      >
        {data.xAxisHigh}
      </text>

      {/* Y-axis label (horizontal, left of plot, wrapping if long) */}
      <text textAnchor="end" className="fill-gray-500 font-mono text-[12px]">
        {yAxisLines.map((line, li) => (
          <tspan
            key={li}
            x={PLOT_X - 8}
            y={
              PLOT_Y +
              PLOT_HEIGHT / 2 -
              ((yAxisLines.length - 1) * YAXIS_LABEL_LINE_HEIGHT) / 2 +
              li * YAXIS_LABEL_LINE_HEIGHT
            }
          >
            {line}
          </tspan>
        ))}
      </text>
      {/* Y-axis low */}
      <text
        x={PLOT_X - 8}
        y={PLOT_Y + PLOT_HEIGHT - 4}
        textAnchor="end"
        className="fill-gray-400 font-mono text-[11px]"
      >
        {data.yAxisLow}
      </text>
      {/* Y-axis high */}
      <text
        x={PLOT_X - 8}
        y={PLOT_Y + 10}
        textAnchor="end"
        className="fill-gray-400 font-mono text-[11px]"
      >
        {data.yAxisHigh}
      </text>

      {/* User position dot */}
      {userPos && (
        <g>
          <circle
            cx={userPos.x}
            cy={userPos.y}
            r={16}
            fill={accentHex}
            fillOpacity={0.25}
            stroke={accentHex}
            strokeWidth={2.5}
          />
          <circle cx={userPos.x} cy={userPos.y} r={6} fill={accentHex} />
          <text
            x={userPos.x}
            y={userPos.y - 22}
            textAnchor="middle"
            className="font-mono text-[14px] font-bold"
            fill={accentHex}
          >
            You
          </text>
        </g>
      )}
    </svg>
  )
}
