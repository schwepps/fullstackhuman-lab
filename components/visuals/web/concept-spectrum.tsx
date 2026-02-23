import { spectrumTickX } from '@/lib/visuals/geometry'
import type { ConceptSpectrumData } from '@/lib/visuals/types'

const TRACK_X = 40
const TRACK_WIDTH = 320
const TRACK_Y = 50
const TRACK_HEIGHT = 12

interface ConceptSpectrumProps {
  data: ConceptSpectrumData
  accentHex: string
}

export function ConceptSpectrum({ data, accentHex }: ConceptSpectrumProps) {
  const markerX = spectrumTickX(TRACK_X, TRACK_WIDTH, data.userPosition)

  return (
    <svg
      viewBox="0 0 400 120"
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label={`${data.title}: ${data.userLabel} positioned at ${Math.round(data.userPosition * 100)}%`}
    >
      {/* Title */}
      <text
        x={TRACK_X + TRACK_WIDTH / 2}
        y={18}
        textAnchor="middle"
        className="fill-gray-700 font-mono text-[11px] font-semibold"
      >
        {data.title}
      </text>

      {/* Track background with gradient */}
      <defs>
        <linearGradient id="spectrum-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="50%" stopColor={accentHex} stopOpacity={0.2} />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      <rect
        x={TRACK_X}
        y={TRACK_Y}
        width={TRACK_WIDTH}
        height={TRACK_HEIGHT}
        rx={TRACK_HEIGHT / 2}
        fill="url(#spectrum-gradient)"
        stroke="#d1d5db"
        strokeWidth={0.5}
      />

      {/* Endpoint labels */}
      <text
        x={TRACK_X}
        y={TRACK_Y - 8}
        textAnchor="start"
        className="fill-gray-500 font-mono text-[10px]"
      >
        {data.leftLabel}
      </text>
      <text
        x={TRACK_X + TRACK_WIDTH}
        y={TRACK_Y - 8}
        textAnchor="end"
        className="fill-gray-500 font-mono text-[10px]"
      >
        {data.rightLabel}
      </text>

      {/* Mid label if present */}
      {data.midLabel && (
        <text
          x={TRACK_X + TRACK_WIDTH / 2}
          y={TRACK_Y - 8}
          textAnchor="middle"
          className="fill-gray-400 font-mono text-[9px]"
        >
          {data.midLabel}
        </text>
      )}

      {/* User position marker */}
      <g>
        {/* Marker triangle pointing down */}
        <polygon
          points={`${markerX - 6},${TRACK_Y - 2} ${markerX + 6},${TRACK_Y - 2} ${markerX},${TRACK_Y + 4}`}
          fill={accentHex}
        />
        {/* Marker circle on track */}
        <circle
          cx={markerX}
          cy={TRACK_Y + TRACK_HEIGHT / 2}
          r={8}
          fill="white"
          stroke={accentHex}
          strokeWidth={2.5}
        />
        <circle
          cx={markerX}
          cy={TRACK_Y + TRACK_HEIGHT / 2}
          r={3}
          fill={accentHex}
        />
      </g>

      {/* User label below */}
      <text
        x={markerX}
        y={TRACK_Y + TRACK_HEIGHT + 24}
        textAnchor="middle"
        className="font-mono text-[10px] font-bold"
        fill={accentHex}
      >
        {data.userLabel}
      </text>
    </svg>
  )
}
