'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

const EXPERTISE_KEYS = ['leadership', 'product', 'tech', 'ai'] as const

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

export function AboutSection() {
  const t = useTranslations('aboutSection')

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 sm:py-20"
    >
      {/* Section title */}
      <motion.h2
        variants={itemVariants}
        className="terminal-text-glow mb-4 text-center font-mono text-lg font-bold tracking-widest text-primary sm:text-xl"
      >
        {t('title')}
      </motion.h2>

      {/* Intro */}
      <motion.p
        variants={itemVariants}
        className="mx-auto mb-12 max-w-2xl text-center text-sm leading-relaxed text-foreground/60 sm:text-base"
      >
        {t('intro')}
      </motion.p>

      {/* Expertise grid */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EXPERTISE_KEYS.map((key) => (
          <motion.div key={key} variants={itemVariants}>
            <Card className="h-full border-primary/10 bg-card/50 transition-colors hover:border-primary/30">
              <CardContent className="px-4 pt-5">
                <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary lg:min-h-10">
                  {t(`expertise.${key}.title`)}
                </h3>
                <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/50 sm:text-sm">
                  {t(`expertise.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
