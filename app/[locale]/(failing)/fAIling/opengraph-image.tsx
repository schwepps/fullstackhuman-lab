import { ImageResponse } from 'next/og'
import { BRAND_COLORS, BRAND_NAME } from '@/lib/constants/brand'
import { resolveLocale } from '@/lib/seo/schemas'
import { FshLogo, OG_ACCENT_LINE, OG_CONTENT, OG_CORNERS } from './og-elements'

/**
 * Static alt text — framework constraint: OG image route handlers
 * don't support async exports. The locale-aware alt is provided by
 * generateMetadata in page.tsx via t('ogImageAlt').
 */
export const alt = 'The fAIling Manifesto'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const { BG, FG, FAILING_RED, FAILING_FATAL, MUTED } = BRAND_COLORS

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const lang = resolveLocale(locale)
  const content = OG_CONTENT[lang]

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
      {/* Ambient glow — red instead of cyan */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 300,
          width: 600,
          height: 320,
          background:
            'radial-gradient(ellipse at center, rgba(255, 51, 51, 0.08) 0%, transparent 70%)',
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
          background: OG_ACCENT_LINE,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '10%',
          width: '80%',
          height: 2,
          background: OG_ACCENT_LINE,
        }}
      />

      {/* Viewfinder corners — red */}
      {OG_CORNERS.map((style, i) => (
        <div
          key={i}
          style={{ position: 'absolute', width: 40, height: 40, ...style }}
        />
      ))}

      <FshLogo />

      {/* Brand wordmark — intentionally FAILING_FATAL instead of MUTED for thematic consistency */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 48,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${FAILING_RED})`,
          }}
        />
        <span
          style={{
            fontSize: 14,
            color: FAILING_FATAL,
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
            background: `linear-gradient(90deg, ${FAILING_RED}, transparent)`,
          }}
        />
      </div>

      {/* Title — with "AI" highlighted */}
      <div
        style={{
          display: 'flex',
          fontSize: 56,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.15,
          marginBottom: 14,
        }}
      >
        <span style={{ color: FG }}>
          {lang === 'en' ? 'The f' : 'Le manifeste f'}
        </span>
        <span style={{ color: FAILING_RED }}>AI</span>
        <span style={{ color: FG }}>ling</span>
        {lang === 'en' ? <span style={{ color: FG }}> Manifesto</span> : null}
      </div>

      {/* Subtitle */}
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          color: MUTED,
          marginBottom: 48,
        }}
      >
        {content.subtitle}
      </div>

      {/* Tagline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 16,
          color: MUTED,
          fontFamily: 'monospace',
        }}
      >
        <span>{content.tagline}</span>
        <span style={{ color: FAILING_RED }}>fullstackhuman.sh</span>
      </div>
    </div>,
    { ...size }
  )
}
