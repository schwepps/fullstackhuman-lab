import { describe, it, expect } from 'vitest'
import {
  t,
  detectLanguage,
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  QUOTA_EXCEEDED,
  AI_ERROR,
  PERSONA_BUTTON_LABELS,
  PERSONA_STARTING,
} from '@/lib/telegram/i18n'

// ---------------------------------------------------------------------------
// detectLanguage
// ---------------------------------------------------------------------------

describe('detectLanguage', () => {
  it('returns "fr" for language code "fr"', () => {
    expect(detectLanguage('fr')).toBe('fr')
  })

  it('returns "fr" for language code "fr-FR"', () => {
    expect(detectLanguage('fr-FR')).toBe('fr')
  })

  it('returns "fr" for language code "fr-CA"', () => {
    expect(detectLanguage('fr-CA')).toBe('fr')
  })

  it('returns "en" for language code "en"', () => {
    expect(detectLanguage('en')).toBe('en')
  })

  it('returns "en" for language code "en-US"', () => {
    expect(detectLanguage('en-US')).toBe('en')
  })

  it('returns "en" for language code "en-GB"', () => {
    expect(detectLanguage('en-GB')).toBe('en')
  })

  it('returns "en" for German language code "de"', () => {
    expect(detectLanguage('de')).toBe('en')
  })

  it('returns "en" for Spanish language code "es"', () => {
    expect(detectLanguage('es')).toBe('en')
  })

  it('returns "en" for Japanese language code "ja"', () => {
    expect(detectLanguage('ja')).toBe('en')
  })

  it('returns "en" for Chinese language code "zh"', () => {
    expect(detectLanguage('zh')).toBe('en')
  })

  it('returns "en" for Portuguese language code "pt-BR"', () => {
    expect(detectLanguage('pt-BR')).toBe('en')
  })

  it('returns "fr" for undefined language code (default)', () => {
    expect(detectLanguage(undefined)).toBe('fr')
  })

  it('returns "fr" for empty string (falsy, treated as missing)', () => {
    expect(detectLanguage('')).toBe('fr')
  })
})

// ---------------------------------------------------------------------------
// t (translation helper)
// ---------------------------------------------------------------------------

describe('t', () => {
  it('returns French message for "fr" language', () => {
    expect(t(WELCOME_MESSAGE, 'fr')).toBe(WELCOME_MESSAGE.fr)
  })

  it('returns English message for "en" language', () => {
    expect(t(WELCOME_MESSAGE, 'en')).toBe(WELCOME_MESSAGE.en)
  })

  it('returns correct French help message', () => {
    expect(t(HELP_MESSAGE, 'fr')).toBe(HELP_MESSAGE.fr)
  })

  it('returns correct English help message', () => {
    expect(t(HELP_MESSAGE, 'en')).toBe(HELP_MESSAGE.en)
  })

  it('returns correct French quota exceeded message', () => {
    expect(t(QUOTA_EXCEEDED, 'fr')).toBe(QUOTA_EXCEEDED.fr)
  })

  it('returns correct English quota exceeded message', () => {
    expect(t(QUOTA_EXCEEDED, 'en')).toBe(QUOTA_EXCEEDED.en)
  })

  it('returns correct French AI error message', () => {
    expect(t(AI_ERROR, 'fr')).toBe(AI_ERROR.fr)
  })

  it('returns correct English AI error message', () => {
    expect(t(AI_ERROR, 'en')).toBe(AI_ERROR.en)
  })

  describe('message content verification', () => {
    it('WELCOME_MESSAGE contains both language variants', () => {
      expect(WELCOME_MESSAGE.fr).toBeTruthy()
      expect(WELCOME_MESSAGE.en).toBeTruthy()
      expect(WELCOME_MESSAGE.fr).not.toBe(WELCOME_MESSAGE.en)
    })

    it('PERSONA_BUTTON_LABELS has all three personas', () => {
      expect(PERSONA_BUTTON_LABELS.doctor.fr).toBeTruthy()
      expect(PERSONA_BUTTON_LABELS.doctor.en).toBeTruthy()
      expect(PERSONA_BUTTON_LABELS.critic.fr).toBeTruthy()
      expect(PERSONA_BUTTON_LABELS.critic.en).toBeTruthy()
      expect(PERSONA_BUTTON_LABELS.guide.fr).toBeTruthy()
      expect(PERSONA_BUTTON_LABELS.guide.en).toBeTruthy()
    })

    it('PERSONA_STARTING has all three personas', () => {
      expect(PERSONA_STARTING.doctor.fr).toBeTruthy()
      expect(PERSONA_STARTING.doctor.en).toBeTruthy()
      expect(PERSONA_STARTING.critic.fr).toBeTruthy()
      expect(PERSONA_STARTING.critic.en).toBeTruthy()
      expect(PERSONA_STARTING.guide.fr).toBeTruthy()
      expect(PERSONA_STARTING.guide.en).toBeTruthy()
    })
  })
})
