'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TerminalBoot } from '@/components/marketing/terminal-boot'
import { HeroSection } from '@/components/marketing/hero-section'
import { AboutSection } from '@/components/marketing/about-section'

export default function HomePage() {
  const [isBootComplete, setIsBootComplete] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!isBootComplete && (
          <TerminalBoot onComplete={() => setIsBootComplete(true)} />
        )}
      </AnimatePresence>
      <HeroSection isVisible={isBootComplete} />
      <AboutSection />
    </>
  )
}
