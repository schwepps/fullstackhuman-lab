import { ImageResponse } from 'next/og'
import { BRAND_COLORS, BRAND_NAME, FSH_LOGO_PATHS } from '@/lib/constants/brand'

export const alt = 'Fullstackhuman'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const { PRIMARY, BG, FG, MUTED } = BRAND_COLORS

/** Locale-specific OG image text (not i18n — baked into the image). */
const CONTENT = {
  fr: {
    title: 'Conseil IA, sans filtre',
    subtitle: 'Produit, tech et leadership — en une conversation',
    personas: [
      { verb: 'DIAGNOSTIQUE', name: 'Le Docteur' },
      { verb: 'ÉVALUE', name: 'Le Critique' },
      { verb: 'RECADRE', name: 'Le Guide' },
    ],
  },
  en: {
    title: 'AI Consulting, Straight Talk',
    subtitle: 'Product, tech & leadership — in one conversation',
    personas: [
      { verb: 'DIAGNOSE', name: 'The Doctor' },
      { verb: 'REVIEW', name: 'The Critic' },
      { verb: 'REFRAME', name: 'The Guide' },
    ],
  },
} as const

/** Viewfinder L-bracket corners — generates all 4 from a config. */
const CORNERS = [
  {
    top: 32,
    left: 32,
    borderTop: `2px solid ${PRIMARY}`,
    borderLeft: `2px solid ${PRIMARY}`,
  },
  {
    top: 32,
    right: 32,
    borderTop: `2px solid ${PRIMARY}`,
    borderRight: `2px solid ${PRIMARY}`,
  },
  {
    bottom: 32,
    left: 32,
    borderBottom: `2px solid ${PRIMARY}`,
    borderLeft: `2px solid ${PRIMARY}`,
  },
  {
    bottom: 32,
    right: 32,
    borderBottom: `2px solid ${PRIMARY}`,
    borderRight: `2px solid ${PRIMARY}`,
  },
] as const

const ACCENT_LINE = `linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.25), ${PRIMARY}, rgba(34, 211, 238, 0.25), transparent)`

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = locale === 'en' ? 'en' : 'fr'
  const content = CONTENT[lang]

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BG,
        position: 'relative',
      }}
    >
      {/* Ambient glow behind logo */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 300,
          width: 600,
          height: 320,
          background:
            'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Accent lines top + bottom */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          width: '80%',
          height: 2,
          background: ACCENT_LINE,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '10%',
          width: '80%',
          height: 2,
          background: ACCENT_LINE,
        }}
      />

      {/* Viewfinder corners */}
      {CORNERS.map((style, i) => (
        <div
          key={i}
          style={{ position: 'absolute', width: 40, height: 40, ...style }}
        />
      ))}

      {/* {FSH} SVG Logo */}
      <svg
        width="160"
        height="96"
        viewBox={FSH_LOGO_PATHS.viewBox}
        fill="none"
        style={{ marginBottom: 8 }}
      >
        <path
          d={FSH_LOGO_PATHS.openBrace}
          stroke={PRIMARY}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <line
          x1="8"
          y1="4"
          x2="8"
          y2="20"
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="8"
          y1="4"
          x2="14"
          y2="4"
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="8"
          y1="12"
          x2="13"
          y2="12"
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polyline
          points={FSH_LOGO_PATHS.sPoints}
          stroke={PRIMARY}
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
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="12"
          x2="30"
          y2="12"
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="30"
          y1="4"
          x2="30"
          y2="20"
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={FSH_LOGO_PATHS.closeBrace}
          stroke={PRIMARY}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* FULL_STACK_HUMAN wordmark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 48,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${PRIMARY})`,
          }}
        />
        <span
          style={{
            fontSize: 14,
            color: MUTED,
            fontFamily: 'monospace',
            letterSpacing: '0.2em',
          }}
        >
          {BRAND_NAME}
        </span>
        <div
          style={{
            width: 48,
            height: 1,
            background: `linear-gradient(90deg, ${PRIMARY}, transparent)`,
          }}
        />
      </div>

      {/* Title */}
      <div
        style={{
          display: 'flex',
          fontSize: 56,
          fontWeight: 700,
          color: FG,
          textAlign: 'center',
          lineHeight: 1.15,
          marginBottom: 14,
        }}
      >
        {content.title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          display: 'flex',
          fontSize: 22,
          color: MUTED,
          marginBottom: 48,
        }}
      >
        {content.subtitle}
      </div>

      {/* Persona modules */}
      <div style={{ display: 'flex', gap: 48 }}>
        {content.personas.map((p) => (
          <div
            key={p.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingLeft: 16,
              borderLeft: '2px solid rgba(34, 211, 238, 0.3)',
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: PRIMARY,
                fontFamily: 'monospace',
                letterSpacing: '0.15em',
              }}
            >
              {p.verb}
            </span>
            <span style={{ fontSize: 17, color: FG, opacity: 0.6 }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  )
}
