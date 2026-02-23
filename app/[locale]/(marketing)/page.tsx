import { HeroSection } from '@/components/marketing/hero-section'
import { AboutSection } from '@/components/marketing/about-section'
import { MultiJsonLd } from '@/components/seo/json-ld'
import {
  getOrganizationSchema,
  getProfessionalServiceSchema,
  getWebApplicationSchema,
} from '@/lib/seo/schemas'

export default function HomePage() {
  return (
    <>
      <MultiJsonLd
        schemas={[
          getOrganizationSchema(),
          getProfessionalServiceSchema(),
          getWebApplicationSchema(),
        ]}
      />
      <HeroSection isVisible />
      <AboutSection />
    </>
  )
}
