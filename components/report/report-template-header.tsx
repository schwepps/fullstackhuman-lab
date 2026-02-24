import { getTranslations } from 'next-intl/server'
import { FshIconMark } from '@/components/layout/fsh-logo'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import type { PersonaId } from '@/types/chat'

interface ReportTemplateHeaderProps {
  title: string
  persona: PersonaId
  accentHex: string
  createdAt: string
}

export async function ReportTemplateHeader({
  title,
  persona,
  accentHex,
  createdAt,
}: ReportTemplateHeaderProps) {
  const t = await getTranslations('reportTemplate')
  const Illustration = PERSONA_ILLUSTRATIONS[persona]

  const date = new Date(createdAt)
  const formattedDate = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header>
      {/* Accent top border */}
      <div className="h-[3px] w-full" style={{ backgroundColor: accentHex }} />

      <div className="px-6 pt-6 pb-6 sm:px-8">
        {/* Brand + date row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <FshIconMark className="h-5 w-auto" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Full Stack Human
            </span>
          </div>
          <time
            dateTime={date.toISOString()}
            className="font-mono text-[10px] text-gray-400"
          >
            {formattedDate}
          </time>
        </div>

        {/* Persona badge */}
        <div
          className="mt-5 flex items-center gap-2"
          style={{ color: accentHex }}
        >
          <Illustration className="size-5" />
          <span className="font-mono text-sm font-semibold uppercase tracking-wider">
            {t(`personaName.${persona}`)}
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>

        {/* Divider */}
        <div
          className="mt-5 h-px w-full"
          style={{ backgroundColor: accentHex, opacity: 0.2 }}
        />
      </div>
    </header>
  )
}
