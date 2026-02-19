'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { PortraitViewfinder } from '@/components/marketing/portrait-viewfinder'
import type { HeroSectionProps } from '@/types/marketing'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

export function HeroSection({ isVisible }: HeroSectionProps) {
  const t = useTranslations('hero')

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className="flex min-h-svh flex-col items-center justify-center px-4 py-16 sm:px-6"
    >
      {/* Headline */}
      <motion.h1
        variants={itemVariants}
        className="terminal-text-glow mb-8 text-center text-2xl font-bold tracking-tight animate-glitch-intermittent sm:text-4xl lg:text-5xl"
      >
        {t('headline')}
      </motion.h1>

      {/* Portrait */}
      <motion.div variants={itemVariants} className="mb-8">
        <PortraitViewfinder />
      </motion.div>

      {/* Sub-headline */}
      <motion.p
        variants={itemVariants}
        className="mb-10 text-center text-base text-foreground/60 sm:text-lg"
      >
        {t('subheadline')}
      </motion.p>

      {/* CTA */}
      <motion.div variants={itemVariants}>
        <a
          href="#connect"
          className="btn-cyber terminal-text-glow inline-flex h-12 items-center px-8 font-mono text-sm uppercase tracking-widest animate-pulse-border touch-manipulation sm:h-10"
        >
          {t('cta')}
        </a>
      </motion.div>
    </motion.section>
  )
}
