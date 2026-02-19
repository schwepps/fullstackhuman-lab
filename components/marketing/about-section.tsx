'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'

export function AboutSection() {
  const t = useTranslations('about')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto max-w-2xl px-4 pb-24 sm:px-6"
    >
      <div className="mb-6 h-px w-full bg-border" />

      <p className="text-sm leading-relaxed text-foreground/50 sm:text-base">
        {t('bio')}
      </p>
    </motion.section>
  )
}
