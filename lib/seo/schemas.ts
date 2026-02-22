/**
 * JSON-LD Schema generators for SEO and GEO optimization.
 * These schemas help search engines and AI systems understand our content.
 *
 * SSOT: Persona data from lib/constants/personas.ts.
 * Keep aligned with translations — run `pnpm check:seo`.
 */

import { APP_URL } from '@/lib/constants/app'
import { SEO_PERSONAS } from '@/lib/constants/personas'

/**
 * Organization schema — establishes brand identity for search engines.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fullstackhuman',
    url: APP_URL,
    logo: `${APP_URL}/images/fullstackhuman.png`,
    description:
      'AI consulting tool that productizes expert guidance through interactive personas. Product thinking, technical depth, and delivery instinct — at machine speed.',
    foundingDate: '2025',
    founder: {
      '@type': 'Person',
      name: 'François Schuers',
      jobTitle: 'Product & Tech Leader',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'consulting',
      url: 'https://calendly.com/fullstackhuman',
    },
  }
}

/**
 * ProfessionalService schema — describes the consulting offering.
 * The three personas map to distinct service types.
 */
export function getProfessionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Fullstackhuman AI Consulting',
    url: APP_URL,
    description:
      'On-demand AI consulting with 15+ years of product and tech leadership experience. Three modes: project diagnostics, honest reviews, and strategic reframing.',
    provider: {
      '@type': 'Organization',
      name: 'Fullstackhuman',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Consulting Personas',
      itemListElement: SEO_PERSONAS.map((persona) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: persona.name,
          description: persona.description,
        },
      })),
    },
  }
}

/**
 * WebApplication schema — describes the SaaS product for rich results.
 */
export function getWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Fullstackhuman',
    url: APP_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free tier with daily conversation limit',
    },
    featureList: [
      'AI-powered project diagnostics',
      'Honest product and architecture reviews',
      'Strategic reframing with frameworks',
      'Structured diagnostic reports',
      'Bilingual support (French / English)',
    ],
  }
}
