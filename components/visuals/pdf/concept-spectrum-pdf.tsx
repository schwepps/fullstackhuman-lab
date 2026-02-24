import React from 'react'
import {
  Svg,
  Rect,
  Circle,
  Polygon,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from '@react-pdf/renderer'
import { spectrumTickX } from '@/lib/visuals/geometry'
import type { ConceptSpectrumData } from '@/lib/visuals/types'

const TRACK_X = 40
const TRACK_W = 320
const TRACK_Y = 44
const TRACK_H = 12

export function ConceptSpectrumPdf({
  data,
  accentHex,
}: {
  data: ConceptSpectrumData
  accentHex: string
}) {
  const mx = spectrumTickX(TRACK_X, TRACK_W, data.userPosition)

  return (
    <Svg width="400" height="110" viewBox="0 0 400 110">
      {/* Title */}
      <SvgText
        x={TRACK_X + TRACK_W / 2}
        y={16}
        textAnchor="middle"
        style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}
        fill="#374151"
      >
        {data.title}
      </SvgText>
      {/* Track */}
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#e5e7eb" />
          <Stop offset="50%" stopColor={accentHex} stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#e5e7eb" />
        </LinearGradient>
      </Defs>
      <Rect
        x={TRACK_X}
        y={TRACK_Y}
        width={TRACK_W}
        height={TRACK_H}
        rx={6}
        fill="url(#sg)"
        stroke="#d1d5db"
        strokeWidth={0.5}
      />
      {/* Endpoint labels */}
      <SvgText
        x={TRACK_X}
        y={TRACK_Y - 6}
        textAnchor="start"
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        {data.leftLabel}
      </SvgText>
      <SvgText
        x={TRACK_X + TRACK_W}
        y={TRACK_Y - 6}
        textAnchor="end"
        style={{ fontSize: 8, fontFamily: 'Helvetica' }}
        fill="#6b7280"
      >
        {data.rightLabel}
      </SvgText>
      {/* Marker */}
      <Polygon
        points={`${mx - 5},${TRACK_Y - 1} ${mx + 5},${TRACK_Y - 1} ${mx},${TRACK_Y + 4}`}
        fill={accentHex}
      />
      <Circle
        cx={mx}
        cy={TRACK_Y + TRACK_H / 2}
        r={7}
        fill="white"
        stroke={accentHex}
        strokeWidth={2}
      />
      <Circle cx={mx} cy={TRACK_Y + TRACK_H / 2} r={2.5} fill={accentHex} />
      {/* User label */}
      <SvgText
        x={mx}
        y={TRACK_Y + TRACK_H + 20}
        textAnchor="middle"
        style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}
        fill={accentHex}
      >
        {data.userLabel}
      </SvgText>
    </Svg>
  )
}
