import { HeroSection } from '@/components/marketing/hero-section'
import { AboutSection } from '@/components/marketing/about-section'
import { MultiJsonLd } from '@/components/seo/json-ld'
import {
  getOrganizationSchema,
  getPersonSchema,
  getProfessionalServiceSchema,
  getWebApplicationSchema,
} from '@/lib/seo/schemas'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  return (
    <>
      <MultiJsonLd
        schemas={[
          getOrganizationSchema(locale),
          getProfessionalServiceSchema(locale),
          getWebApplicationSchema(locale),
          getPersonSchema(locale),
        ]}
      />
      <HeroSection isVisible />
      <AboutSection />
    </>
  )
}
