import type { PersonaId } from '@/types/chat'
import { CALENDLY_URL } from '@/lib/constants/app'

// --- PostHog configuration ---
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

// --- PostHog storage prefix (for cleanup on consent withdrawal) ---
export const POSTHOG_STORAGE_PREFIX = 'ph_'

// --- Event names (SSOT — no magic strings in components) ---
export const ANALYTICS_EVENTS = {
  PERSONA_SELECTED: 'persona_selected',
  REPORT_GENERATED: 'report_generated',
  REPORT_COPIED: 'report_copied',
  CALENDLY_CLICK: 'calendly_click',
  CTA_CLICK: 'cta_click',
  REPORT_LINK_COPIED: 'report_link_copied',
  TELEGRAM_CLICK: 'telegram_click',
} as const

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// --- Event property types ---
export interface PersonaSelectedProperties {
  persona: PersonaId
}

export interface ReportGeneratedProperties {
  persona: PersonaId
  message_count: number
}

export interface ReportCopiedProperties {
  persona: PersonaId
}

export interface ReportLinkCopiedProperties {
  persona: PersonaId
}

export interface CalendlyClickProperties {
  source:
    | 'report'
    | 'report_card'
    | 'hero'
    | 'conversations_dashboard'
    | 'public_report'
    | 'chat_end'
}

export interface TelegramClickProperties {
  source: 'footer' | 'public_report'
}

export interface CtaClickProperties {
  source: 'hero' | 'signup_post_report'
}

// --- Calendly URL detection (derived from SSOT) ---
export const CALENDLY_URL_PATTERN = CALENDLY_URL.replace(/^https?:\/\//, '')
