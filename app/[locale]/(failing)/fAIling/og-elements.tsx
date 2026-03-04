/**
 * Shared OG image elements for the fAIling Manifesto.
 * Extracted to keep opengraph-image.tsx under the 200-line limit.
 */
import { BRAND_COLORS, FSH_LOGO_PATHS } from '@/lib/constants/brand'

const { FAILING_RED } = BRAND_COLORS

export const OG_CONTENT = {
  fr: {
    title: 'Le manifeste fAIling',
    subtitle: "13 règles pour rater avec l'IA",
    tagline: 'Un guide satirique par',
  },
  en: {
    title: 'The fAIling Manifesto',
    subtitle: '13 Rules for Failing with AI',
    tagline: 'A satirical field guide by',
  },
} as const

export const OG_CORNERS = [
  {
    top: 32,
    left: 32,
    borderTop: `2px solid ${FAILING_RED}`,
    borderLeft: `2px solid ${FAILING_RED}`,
  },
  {
    top: 32,
    right: 32,
    borderTop: `2px solid ${FAILING_RED}`,
    borderRight: `2px solid ${FAILING_RED}`,
  },
  {
    bottom: 32,
    left: 32,
    borderBottom: `2px solid ${FAILING_RED}`,
    borderLeft: `2px solid ${FAILING_RED}`,
  },
  {
    bottom: 32,
    right: 32,
    borderBottom: `2px solid ${FAILING_RED}`,
    borderRight: `2px solid ${FAILING_RED}`,
  },
] as const

export const OG_ACCENT_LINE = `linear-gradient(90deg, transparent, rgba(255, 51, 51, 0.25), ${FAILING_RED}, rgba(255, 51, 51, 0.25), transparent)`

/** {FSH} logo in red — smaller than homepage OG (120x72 vs 160x96). */
export function FshLogo() {
  return (
    <svg
      width="120"
      height="72"
      viewBox={FSH_LOGO_PATHS.viewBox}
      fill="none"
      style={{ marginBottom: 8 }}
    >
      <path
        d={FSH_LOGO_PATHS.openBrace}
        stroke={FAILING_RED}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="8"
        y1="4"
        x2="8"
        y2="20"
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="4"
        x2="14"
        y2="4"
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="13"
        y2="12"
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polyline
        points={FSH_LOGO_PATHS.sPoints}
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="24"
        y1="4"
        x2="24"
        y2="20"
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="12"
        x2="30"
        y2="12"
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="4"
        x2="30"
        y2="20"
        stroke={FAILING_RED}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={FSH_LOGO_PATHS.closeBrace}
        stroke={FAILING_RED}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
