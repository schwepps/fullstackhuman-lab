'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/routing'
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
  const tAbout = useTranslations('about')

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className="flex flex-col items-center px-4 py-6 sm:px-6"
    >
      {/* Headline */}
      <motion.h1
        variants={itemVariants}
        className="terminal-text-glow mb-10 text-center text-2xl font-bold tracking-tight animate-glitch-intermittent sm:text-4xl lg:text-5xl"
      >
        {t('headline')}
      </motion.h1>

      {/* Portrait */}
      <motion.div variants={itemVariants} className="mb-10">
        <PortraitViewfinder />
      </motion.div>

      {/* Sub-headline */}
      <motion.p
        variants={itemVariants}
        className="mb-6 text-center text-base text-foreground/60 sm:text-lg"
      >
        {t('subheadline')}
      </motion.p>

      {/* CTA */}
      <motion.div variants={itemVariants} className="mb-8">
        <Link
          href="/chat"
          className="btn-cyber terminal-text-glow inline-flex h-12 items-center px-8 font-mono text-sm uppercase tracking-widest animate-pulse-border touch-manipulation sm:h-10"
        >
          {t('cta')}
        </Link>
      </motion.div>

      {/* Bio */}
      <motion.div variants={itemVariants} className="mx-auto max-w-2xl">
        <div className="mb-4 h-px w-full bg-border" />
        <p className="text-center text-sm leading-relaxed text-foreground/50 sm:text-base">
          {tAbout('bio')}
        </p>
      </motion.div>
    </motion.section>
  )
}
