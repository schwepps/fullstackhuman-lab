import type { PersonaConfig, PersonaId } from '@/types/chat'

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  doctor: {
    id: 'doctor',
    emoji: '\u{1FA7A}',
    reportDetectPattern: /^#\s*\u{1FA7A}/mu,
    promptFile: 'prompt-doctor.md',
  },
  critic: {
    id: 'critic',
    emoji: '\u{1F50D}',
    reportDetectPattern: /^#\s*\u{1F50D}/mu,
    promptFile: 'prompt-critic.md',
  },
  guide: {
    id: 'guide',
    emoji: '\u{1F9ED}',
    reportDetectPattern: /^#\s*\u{1F9ED}/mu,
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
