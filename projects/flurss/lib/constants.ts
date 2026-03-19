import type { Ministry, MinistryInfo } from './types'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return `http://localhost:${process.env.PORT ?? '3000'}`
}

export const SITE_NAME = 'Sinews'
export const SITE_TAGLINE = 'Agence de presse officielle du FlURSS'
export const SITE_DESCRIPTION =
  'Le premier et unique site d\u2019information approuvé par le Parti. Les flux du prolétariat éclairent le monde.'

export const BASE_PATH = basePath

export const IMAGES = {
  hero: `${basePath}/images/hero.webp`,
  economy: `${basePath}/images/economy.webp`,
  international: `${basePath}/images/international.webp`,
  tech: `${basePath}/images/tech.webp`,
  sinan: `${basePath}/images/sinan.webp`,
} as const

export const AUDIO = {
  anthem: `${basePath}/audio/anthem.mp3`,
} as const

export const MINISTRIES: Record<Ministry, MinistryInfo> = {
  'verite-numerique': {
    label: 'Ministère de la Vérité Numérique',
    image: 'tech',
  },
  'production-culturelle': {
    label: 'Ministère de la Production Culturelle',
  },
  'planification-economique': {
    label: 'Ministère de la Planification Économique',
    image: 'economy',
  },
  'relations-exterieures': {
    label: 'Ministère des Relations Extérieures',
    image: 'international',
  },
  'solidarite-populaire': {
    label: 'Ministère de la Solidarité Populaire',
  },
  'education-revolutionnaire': {
    label: "Ministère de l'Éducation Révolutionnaire",
  },
  'sante-du-peuple': {
    label: 'Ministère de la Santé du Peuple',
  },
  'sport-heroique': {
    label: 'Bureau du Sport Héroïque',
  },
} as const
