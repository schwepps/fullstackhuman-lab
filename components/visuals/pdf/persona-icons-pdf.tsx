import React from 'react'
import { Svg, Circle, Line, Path, Polygon } from '@react-pdf/renderer'
import type { PersonaId } from '@/types/chat'

const ICON_SIZE = 24

/**
 * Simplified Doctor icon for PDF badge.
 * Stethoscope with earpieces and tube (port of DoctorIllustration).
 */
function DoctorIconPdf({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 80 80">
      <Circle
        cx={40}
        cy={56}
        r={12}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4 2"
      />
      <Circle cx={40} cy={56} r={5} stroke={color} strokeWidth={1.5} />
      <Circle cx={40} cy={56} r={1.5} fill={color} />
      <Path
        d="M28 56 C20 56 16 48 16 40 C16 28 24 20 36 20 L44 20 C56 20 64 28 64 40 C64 48 60 56 52 56"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={36} cy={16} r={3} stroke={color} strokeWidth={1.5} />
      <Circle cx={44} cy={16} r={3} stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

/**
 * Simplified Critic icon for PDF badge.
 * Magnifying glass with handle (port of CriticIllustration).
 */
function CriticIconPdf({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 80 80">
      <Circle cx={34} cy={34} r={18} stroke={color} strokeWidth={2} />
      <Circle
        cx={34}
        cy={34}
        r={12}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3 3"
        strokeOpacity={0.5}
      />
      <Line
        x1={47}
        y1={47}
        x2={66}
        y2={66}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  )
}

/**
 * Simplified Guide icon for PDF badge.
 * Compass with cardinal marks and needle (port of GuideIllustration).
 */
function GuideIconPdf({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={26} stroke={color} strokeWidth={2} />
      <Line
        x1={40}
        y1={14}
        x2={40}
        y2={20}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={40}
        y1={60}
        x2={40}
        y2={66}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={14}
        y1={40}
        x2={20}
        y2={40}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={60}
        y1={40}
        x2={66}
        y2={40}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Polygon points="40,18 37,40 43,40" fill={color} fillOpacity={0.8} />
      <Polygon points="40,62 37,40 43,40" fill={color} fillOpacity={0.3} />
      <Circle cx={40} cy={40} r={3} stroke={color} strokeWidth={1.5} />
      <Circle cx={40} cy={40} r={1} fill={color} />
    </Svg>
  )
}

const PERSONA_ICON_MAP: Record<
  PersonaId,
  React.ComponentType<{ color: string }>
> = {
  doctor: DoctorIconPdf,
  critic: CriticIconPdf,
  guide: GuideIconPdf,
}

export function PersonaIconPdf({
  persona,
  color,
}: {
  persona: PersonaId
  color: string
}) {
  const Icon = PERSONA_ICON_MAP[persona]
  return <Icon color={color} />
}
