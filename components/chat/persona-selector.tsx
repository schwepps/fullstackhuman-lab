'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
  PERSONA_IDS,
  PERSONA_TRIGGER_KEYS,
  PERSONA_DESCRIPTION_KEYS,
} from '@/lib/constants/personas'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import type { PersonaId } from '@/types/chat'
import type { QuotaPeriod } from '@/types/user'

function getQuotaColor(remaining: number | null): string {
  if (remaining === null) return 'text-primary/70'
  if (remaining === 0) return 'text-destructive'
  if (remaining === 1) return 'text-warning'
  return 'text-primary/70'
}

function getQuotaMessage(
  isExhausted: boolean,
  period: QuotaPeriod,
  remaining: number | null,
  limit: number | null,
  t: ReturnType<typeof useTranslations>
): string {
  if (isExhausted) return t('quota.exhausted')
  if (limit === null || remaining === null) return t('quota.remainingUnlimited')
  if (period === 'month') return t('quota.remainingMonth', { remaining, limit })
  return t('quota.remainingDay', { remaining, limit })
}

interface PersonaSelectorProps {
  onSelect: (persona: PersonaId) => void
  remaining: number | null
  limit: number | null
  period: QuotaPeriod
  isLoading: boolean
}

export function PersonaSelector({
  onSelect,
  remaining,
  limit,
  period,
  isLoading,
}: PersonaSelectorProps) {
  const t = useTranslations('chat')
  const isUnlimited = limit === null
  const isExhausted = !isLoading && !isUnlimited && remaining === 0

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <h1 className="terminal-text-glow mb-3 text-2xl font-bold text-primary sm:text-3xl">
          {t('selection.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('selection.subtitle')}
        </p>
        {!isLoading && (
          <span
            className={`terminal-border mt-3 inline-block px-3 py-1 font-mono text-xs ${getQuotaColor(remaining)}`}
          >
            {getQuotaMessage(isExhausted, period, remaining, limit, t)}
          </span>
        )}
      </motion.div>

      <div className="grid w-full max-w-3xl gap-4 md:grid-cols-3">
        {PERSONA_IDS.map((id, index) => {
          const Illustration = PERSONA_ILLUSTRATIONS[id]
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
            >
              <Card
                role="button"
                tabIndex={isExhausted ? -1 : 0}
                onClick={() => {
                  if (!isExhausted) onSelect(id)
                }}
                onKeyDown={(e) => {
                  if (!isExhausted && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelect(id)
                  }
                }}
                aria-disabled={isExhausted}
                className={`h-full transition-all touch-manipulation ${
                  isExhausted
                    ? 'cursor-not-allowed border-border opacity-50'
                    : 'cursor-pointer border-primary/20 hover:border-primary/50 terminal-glow-hover active:scale-[0.98]'
                }`}
              >
                <CardContent className="flex h-full flex-col items-center gap-3 pt-6 text-center">
                  <Illustration className="size-20 text-primary" />
                  <h2 className="min-h-[3em] font-semibold text-primary">
                    {t(PERSONA_TRIGGER_KEYS[id])}
                  </h2>
                  <p className="flex-1 text-sm text-muted-foreground">
                    {t(PERSONA_DESCRIPTION_KEYS[id])}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
