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
  'Le premier et unique site d\u2019information approuve par le Parti. Les flux du proletariat eclairent le monde.'

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
    label: 'Ministere de la Verite Numerique',
    image: 'tech',
  },
  'production-culturelle': {
    label: 'Ministere de la Production Culturelle',
  },
  'planification-economique': {
    label: 'Ministere de la Planification Economique',
    image: 'economy',
  },
  'relations-exterieures': {
    label: 'Ministere des Relations Exterieures',
    image: 'international',
  },
  'solidarite-populaire': {
    label: 'Ministere de la Solidarite Populaire',
  },
  'education-revolutionnaire': {
    label: "Ministere de l'Education Revolutionnaire",
  },
  'sante-du-peuple': {
    label: 'Ministere de la Sante du Peuple',
  },
  'sport-heroique': {
    label: 'Bureau du Sport Heroique',
  },
} as const
