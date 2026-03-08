/**
 * JSON-LD Schema generators for SEO and GEO optimization.
 * These schemas help search engines and AI systems understand our content.
 *
 * All generators accept a `locale` param and include `inLanguage` for
 * locale-aware structured data (2026 best practice).
 *
 * SSOT: Persona data from lib/constants/personas.ts.
 * Keep aligned with translations — run `pnpm check:seo`.
 */

import {
  APP_URL,
  BOOK_PATH,
  LINKEDIN_URL,
  TWITTER_URL,
  TELEGRAM_BOT_URL,
} from '@/lib/constants/app'
import { BRAND_NAME_DISPLAY, FOUNDER_NAME } from '@/lib/constants/brand'
import { FAILING_PUBLISHED_DATE } from '@/lib/constants/failing'
import { SEO_PERSONAS } from '@/lib/constants/personas'
import { localePrefix } from '@/lib/seo/urls'

type SchemaLocale = 'en' | 'fr'

export function resolveLocale(locale: string): SchemaLocale {
  return locale === 'en' ? 'en' : 'fr'
}

const ORG_DESCRIPTIONS: Record<SchemaLocale, string> = {
  en: 'Product thinking, tech depth, and delivery instinct — 15+ years of leadership, now an AI you can talk to. Built for CTOs, product leaders, and technical founders.',
  fr: 'Vision produit, expertise technique et instinct de livraison — 15+ ans de leadership, maintenant en IA conversationnelle. Pour les CTOs, product leaders et fondateurs tech.',
}

const SERVICE_DESCRIPTIONS: Record<SchemaLocale, string> = {
  en: 'On-demand consulting for product and tech leaders. Three modes: diagnose stuck projects, get honest reviews, or reframe your thinking. No fluff, no generic answers.',
  fr: 'Conseil à la demande pour leaders produit et tech. Trois modes\u00a0: diagnostiquer les projets bloqués, obtenir des revues honnêtes, ou recadrer votre réflexion. Sans filtre.',
}

const OFFER_DESCRIPTIONS: Record<SchemaLocale, string> = {
  en: 'Free tier with daily conversation limit',
  fr: 'Accès gratuit avec limite quotidienne de conversations',
}

const FEATURE_LISTS: Record<SchemaLocale, string[]> = {
  en: [
    'Project diagnostics — find root causes, not symptoms',
    'Honest product and architecture reviews',
    'Strategic reframing with proven frameworks',
    'Structured reports with actionable recommendations',
    'Bilingual (French / English)',
    'Book a call with full AI conversation context',
  ],
  fr: [
    'Diagnostic projet — trouver les causes, pas les symptômes',
    'Revues honnêtes produit et architecture',
    'Recadrage stratégique avec des frameworks éprouvés',
    'Rapports structurés avec recommandations actionnables',
    'Bilingue (français / anglais)',
    'Réservez un appel avec le contexte complet de la conversation IA',
  ],
}

const PERSON_DESCRIPTIONS: Record<
  SchemaLocale,
  { jobTitle: string; description: string }
> = {
  en: {
    jobTitle: 'Product & Tech Leader',
    description:
      'Engineer turned product leader. 15+ years building, shipping, and leading across finance, energy, sports, blockchain, and AI.',
  },
  fr: {
    jobTitle: 'Leader Produit & Tech',
    description:
      "Ingénieur devenu leader produit. 15+ ans à construire, livrer et piloter dans la finance, l'énergie, le sport, la blockchain et l'IA.",
  },
}

const ARTICLE_TITLES: Record<SchemaLocale, string> = {
  en: 'The fAIling Manifesto — How to Fail with AI',
  fr: "Le manifeste fAIling — Comment rater avec l'IA",
}

const ARTICLE_DESCRIPTIONS: Record<SchemaLocale, string> = {
  en: '13 expert-approved rules for failing with AI. A satirical field guide by fullstackhuman.sh.',
  fr: "13 règles approuvées par les experts pour rater avec l'IA. Un guide satirique par fullstackhuman.sh.",
}

/**
 * Organization schema — establishes brand identity for search engines.
 */
export function getOrganizationSchema(locale: string) {
  const lang = resolveLocale(locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    inLanguage: lang,
    name: BRAND_NAME_DISPLAY,
    url: APP_URL,
    logo: `${APP_URL}/images/fullstackhuman.png`,
    description: ORG_DESCRIPTIONS[lang],
    foundingDate: '2025',
    sameAs: [LINKEDIN_URL, TWITTER_URL, TELEGRAM_BOT_URL],
    founder: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      jobTitle: PERSON_DESCRIPTIONS[lang].jobTitle,
      url: APP_URL,
      sameAs: [LINKEDIN_URL, TWITTER_URL],
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'consulting',
      url: `${APP_URL}${BOOK_PATH}`,
    },
  }
}

/**
 * ProfessionalService schema — describes the consulting offering.
 * The three personas map to distinct service types.
 */
export function getProfessionalServiceSchema(locale: string) {
  const lang = resolveLocale(locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    inLanguage: lang,
    name: `${BRAND_NAME_DISPLAY} AI Consulting`,
    url: APP_URL,
    description: SERVICE_DESCRIPTIONS[lang],
    provider: {
      '@type': 'Organization',
      name: BRAND_NAME_DISPLAY,
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
export function getWebApplicationSchema(locale: string) {
  const lang = resolveLocale(locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    inLanguage: lang,
    name: BRAND_NAME_DISPLAY,
    url: APP_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: OFFER_DESCRIPTIONS[lang],
    },
    featureList: FEATURE_LISTS[lang],
  }
}

/**
 * Article schema for the fAIling Manifesto — satirical content page.
 * Helps search engines understand this as an authored article.
 */
export function getArticleSchema(locale: string) {
  const lang = resolveLocale(locale)
  const prefix = localePrefix(locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    inLanguage: lang,
    headline: ARTICLE_TITLES[lang],
    description: ARTICLE_DESCRIPTIONS[lang],
    url: `${APP_URL}${prefix}/fAIling`,
    author: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      url: APP_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME_DISPLAY,
      url: APP_URL,
    },
    datePublished: FAILING_PUBLISHED_DATE,
    image: `${APP_URL}${prefix}/fAIling/opengraph-image`,
  }
}

/**
 * Person schema — establishes François's knowledge graph presence.
 * Critical for "François Schuers consultant" queries.
 */
export function getPersonSchema(locale: string) {
  const lang = resolveLocale(locale)
  const person = PERSON_DESCRIPTIONS[lang]

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    inLanguage: lang,
    name: FOUNDER_NAME,
    jobTitle: person.jobTitle,
    description: person.description,
    url: APP_URL,
    sameAs: [LINKEDIN_URL, TWITTER_URL],
    // English-only: search engines process knowsAbout in English regardless of page locale
    knowsAbout: [
      'Product Management',
      'Technical Architecture',
      'Team Leadership',
      'AI Strategy',
      'Agile/Scrum',
      'Business Strategy',
    ],
    worksFor: {
      '@type': 'Organization',
      name: BRAND_NAME_DISPLAY,
      url: APP_URL,
    },
  }
}
