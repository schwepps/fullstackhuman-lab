import type { PersonaConfig, PersonaId } from '@/types/chat'

// Optional emoji prefix for backward compat with existing reports (🩺🔍🧭)
const EMOJI_PREFIX = '(?:[\\u{1FA7A}\\u{1F50D}\\u{1F9ED}]\\s*)?'

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  doctor: {
    id: 'doctor',
    reportDetectPattern: new RegExp(
      `^#\\s*${EMOJI_PREFIX}Project Diagnostic Report`,
      'mu'
    ),
    promptFile: 'prompt-doctor.md',
  },
  critic: {
    id: 'critic',
    reportDetectPattern: new RegExp(`^#\\s*${EMOJI_PREFIX}Review Brief`, 'mu'),
    promptFile: 'prompt-critic.md',
  },
  guide: {
    id: 'guide',
    reportDetectPattern: new RegExp(
      `^#\\s*${EMOJI_PREFIX}Framework Brief`,
      'mu'
    ),
    promptFile: 'prompt-guide.md',
  },
} as const

export const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[]

// Typed i18n key maps for next-intl type safety (keys within 'chat' namespace)
export const PERSONA_TRIGGER_KEYS: Record<
  PersonaId,
  | 'personas.doctor.trigger'
  | 'personas.critic.trigger'
  | 'personas.guide.trigger'
> = {
  doctor: 'personas.doctor.trigger',
  critic: 'personas.critic.trigger',
  guide: 'personas.guide.trigger',
}

export const PERSONA_DESCRIPTION_KEYS: Record<
  PersonaId,
  | 'personas.doctor.description'
  | 'personas.critic.description'
  | 'personas.guide.description'
> = {
  doctor: 'personas.doctor.description',
  critic: 'personas.critic.description',
  guide: 'personas.guide.description',
}

export const PERSONA_OPENING_MESSAGE_KEYS: Record<
  PersonaId,
  | 'personas.doctor.openingMessage'
  | 'personas.critic.openingMessage'
  | 'personas.guide.openingMessage'
> = {
  doctor: 'personas.doctor.openingMessage',
  critic: 'personas.critic.openingMessage',
  guide: 'personas.guide.openingMessage',
}

export const PERSONA_NAME_KEYS: Record<
  PersonaId,
  | 'header.personaName.doctor'
  | 'header.personaName.critic'
  | 'header.personaName.guide'
> = {
  doctor: 'header.personaName.doctor',
  critic: 'header.personaName.critic',
  guide: 'header.personaName.guide',
}

/**
 * SEO persona metadata — English descriptions for JSON-LD, WebMCP, and llms.txt.
 * These are always English because they target search engines and AI agents.
 * Keep aligned with messages/en.json persona descriptions — run `pnpm check:seo`.
 */
export const SEO_PERSONAS = [
  {
    id: 'doctor' as const,
    name: 'The Doctor',
    description: 'Project diagnostic — finds the root cause, not the symptoms',
  },
  {
    id: 'critic' as const,
    name: 'The Critic',
    description:
      "Honest review — what works, what doesn't, and what nobody's telling you",
  },
  {
    id: 'guide' as const,
    name: 'The Guide',
    description: 'Framework and thinking — a new way to see your question',
  },
] as const
