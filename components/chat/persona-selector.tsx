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

interface PersonaSelectorProps {
  onSelect: (persona: PersonaId) => void
}

export function PersonaSelector({ onSelect }: PersonaSelectorProps) {
  const t = useTranslations('chat')

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
                tabIndex={0}
                onClick={() => onSelect(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(id)
                  }
                }}
                className="h-full cursor-pointer border-primary/20 transition-all hover:border-primary/50 terminal-glow-hover active:scale-[0.98] touch-manipulation"
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
