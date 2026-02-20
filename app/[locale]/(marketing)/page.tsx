import { HeroSection } from '@/components/marketing/hero-section'
import { AboutSection } from '@/components/marketing/about-section'

export default function HomePage() {
  return (
    <>
      <HeroSection isVisible />
      <AboutSection />
    </>
  )
}
