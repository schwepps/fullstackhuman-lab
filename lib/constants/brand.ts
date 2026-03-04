export const BRAND_NAME = 'FULL_STACK_HUMAN'
export const BRAND_NAME_DISPLAY = 'Fullstackhuman'
export const BRAND_NAME_SHORT = 'FSH'

/**
 * Brand hex colors for contexts where CSS variables are unavailable
 * (e.g., OG image generation via next/og ImageResponse).
 * BG, FG, PRIMARY mirror globals.css theme tokens — keep in sync.
 * MUTED is OG-image-only (not defined in globals.css).
 */
export const BRAND_COLORS = {
  BG: '#0a0a0c',
  FG: '#e2e8f0',
  PRIMARY: '#22d3ee',
  MUTED: '#64748b',
  /** fAIling Manifesto accent — mirrors --color-failing-red in globals.css */
  FAILING_RED: '#ff3333',
  /** fAIling Manifesto fatal — mirrors --color-failing-fatal in globals.css */
  FAILING_FATAL: '#cc0000',
} as const

/**
 * {FSH} logo SVG path data — used in OG image where React components
 * aren't available (Satori renderer requires inline JSX).
 * Source of truth: components/layout/fsh-logo.tsx
 */
export const FSH_LOGO_PATHS = {
  openBrace:
    'M4,2 C2,2 1,3 1,5 L1,10 C1,11 0,12 0,12 C0,12 1,13 1,14 L1,19 C1,21 2,22 4,22',
  closeBrace:
    'M36,2 C38,2 39,3 39,5 L39,10 C39,11 40,12 40,12 C40,12 39,13 39,14 L39,19 C39,21 38,22 36,22',
  sPoints: '21,4 16,4 16,11 21,11 21,20 16,20',
  viewBox: '0 0 40 24',
} as const
