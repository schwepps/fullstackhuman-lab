import { Svg, Path, Line } from '@react-pdf/renderer'

/**
 * PDF-compatible version of the {FSH} icon mark.
 * Port of components/layout/fsh-logo.tsx FshIconMark for @react-pdf/renderer.
 */
export function FshIconMarkPdf({
  width = 36,
  color = '#9ca3af',
}: {
  width?: number
  color?: string
}) {
  const height = (width / 40) * 24

  return (
    <Svg width={width} height={height} viewBox="0 0 40 24">
      {/* { open curly brace */}
      <Path
        d="M4,2 C2,2 1,3 1,5 L1,10 C1,11 0,12 0,12 C0,12 1,13 1,14 L1,19 C1,21 2,22 4,22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* F */}
      <Line
        x1={8}
        y1={4}
        x2={8}
        y2={20}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={8}
        y1={4}
        x2={14}
        y2={4}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={8}
        y1={12}
        x2={13}
        y2={12}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* S — as path since Polyline may not be available */}
      <Path
        d="M21,4 L16,4 L16,11 L21,11 L21,20 L16,20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* H */}
      <Line
        x1={24}
        y1={4}
        x2={24}
        y2={20}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={24}
        y1={12}
        x2={30}
        y2={12}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={30}
        y1={4}
        x2={30}
        y2={20}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* } close curly brace */}
      <Path
        d="M36,2 C38,2 39,3 39,5 L39,10 C39,11 40,12 40,12 C40,12 39,13 39,14 L39,19 C39,21 38,22 36,22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}
