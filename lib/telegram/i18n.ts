import type { PersonaId } from '@/types/chat'
import type { TelegramLanguage } from '@/lib/telegram/types'

/**
 * Bilingual message templates for Telegram bot responses.
 *
 * These are NOT in messages/*.json because they are not rendered
 * via next-intl in a React component context. They are plain strings
 * sent directly via the Telegram API.
 */

type Messages = Record<TelegramLanguage, string>
type PersonaMessages = Record<PersonaId, Messages>

// --- Persona selection ---

export const WELCOME_MESSAGE: Messages = {
  fr: "Bienvenue ! Je suis l'IA de Full Stack Human — 15 ans d'expertise produit & tech, disponible 24/7.\n\nChoisissez votre parcours :",
  en: "Welcome! I'm the Full Stack Human AI — 15 years of product & tech expertise, available 24/7.\n\nChoose your path:",
}

export const PRIVACY_NOTICE: Messages = {
  fr: '🔒 En utilisant ce bot, vous acceptez notre politique de confidentialité : fullstackhuman.sh/privacy',
  en: '🔒 By using this bot, you accept our privacy policy: fullstackhuman.sh/en/privacy',
}

export const PERSONA_BUTTON_LABELS: Record<PersonaId, Messages> = {
  doctor: {
    fr: '🩺 Le Docteur — Mon projet est bloqué',
    en: '🩺 The Doctor — My project is stuck',
  },
  critic: {
    fr: "🔍 Le Critique — J'ai besoin d'un avis",
    en: '🔍 The Critic — I need a second opinion',
  },
  guide: {
    fr: '🧭 Le Guide — Curieux de voir ce que tu fais',
    en: '🧭 The Guide — Just curious what you can do',
  },
}

// --- Conversation state ---

export const NO_ACTIVE_CONVERSATION: Messages = {
  fr: 'Pas de conversation en cours. Utilisez /start pour commencer.',
  en: 'No active conversation. Use /start to begin.',
}

export const CONVERSATION_ABANDONED: Messages = {
  fr: 'Conversation précédente terminée. Utilisez /start pour en démarrer une nouvelle.',
  en: 'Previous conversation ended. Use /start to begin a new one.',
}

export const ALREADY_IN_CONVERSATION: Messages = {
  fr: 'Vous avez déjà une conversation en cours. Utilisez /reset pour la terminer, ou continuez à discuter.',
  en: 'You already have an active conversation. Use /reset to end it, or keep chatting.',
}

export const CONVERSATION_LIMIT_REACHED: Messages = {
  fr: 'Cette conversation a atteint sa limite. Utilisez /start pour en démarrer une nouvelle.',
  en: 'This conversation has reached its limit. Use /start to begin a new one.',
}

export const TURNS_REMAINING: Messages = {
  fr: 'Il vous reste {count} échange(s) avant le rapport.',
  en: 'You have {count} exchange(s) left before the report.',
}

export const DAILY_LIMIT_REACHED: Messages = {
  fr: 'Vous avez atteint la limite quotidienne de messages. Réessayez demain.',
  en: "You've reached the daily message limit. Try again tomorrow.",
}

// --- Quota ---

export const QUOTA_EXCEEDED: Messages = {
  fr: "Vous avez atteint votre limite mensuelle de conversations. Envie d'aller plus loin ?\n\n📅 Réservez un appel : fullstackhuman.sh/chat",
  en: "You've reached your monthly conversation limit. Want to go further?\n\n📅 Book a call: fullstackhuman.sh/chat",
}

// --- Rate limiting ---

export const MESSAGE_RATE_LIMITED: Messages = {
  fr: 'Un instant, vous envoyez des messages trop rapidement. Réessayez dans quelques secondes.',
  en: "Hold on, you're sending messages too quickly. Try again in a few seconds.",
}

// --- Report ---

export const REPORT_READY: Messages = {
  fr: '📋 Votre rapport est prêt !',
  en: '📋 Your report is ready!',
}

export const VIEW_REPORT: Messages = {
  fr: '📄 Voir le rapport complet',
  en: '📄 View full report',
}

export const BOOK_A_CALL: Messages = {
  fr: '📅 Réserver un appel avec François',
  en: '📅 Book a call with François',
}

export const REPORT_CTA: Messages = {
  fr: "C'est ce que l'IA peut voir. François irait plus loin — envie d'en discuter ?",
  en: "That's what the AI can see. François would go deeper — want to talk about it?",
}

// --- Help ---

export const HELP_MESSAGE: Messages = {
  fr: `Commandes disponibles :

/start — Choisir un persona et démarrer une conversation
/reset — Terminer la conversation en cours
/deletedata — Supprimer toutes vos données (RGPD)
/help — Afficher ce message`,
  en: `Available commands:

/start — Choose a persona and start a conversation
/reset — End the current conversation
/deletedata — Delete all your data (GDPR)
/help — Show this message`,
}

// --- GDPR ---

export const DELETE_DATA_CONFIRM: Messages = {
  fr: '✅ Toutes vos données ont été supprimées.',
  en: '✅ All your data has been deleted.',
}

export const DELETE_DATA_FAILED: Messages = {
  fr: "Une erreur s'est produite lors de la suppression. Réessayez plus tard.",
  en: 'An error occurred during deletion. Please try again later.',
}

// --- Errors ---

export const AI_ERROR: Messages = {
  fr: "Désolé, j'ai rencontré un problème. Réessayez dans un instant.",
  en: 'Sorry, I ran into an issue. Please try again in a moment.',
}

export const NON_PRIVATE_CHAT: Messages = {
  fr: 'Ce bot fonctionne uniquement en conversation privée. Envoyez-moi un message direct !',
  en: 'This bot only works in private conversations. Send me a direct message!',
}

// --- Opening messages (persona-specific, first message after selection) ---
// These are sent by the bot, NOT by the AI. The AI's opening message is the
// first AI response in the conversation flow.

export const PERSONA_STARTING: PersonaMessages = {
  doctor: {
    fr: '🩺 Mode Docteur activé. Un instant, je prépare votre consultation...',
    en: '🩺 Doctor mode activated. One moment, preparing your consultation...',
  },
  critic: {
    fr: '🔍 Mode Critique activé. Un instant, je prépare votre session...',
    en: '🔍 Critic mode activated. One moment, preparing your session...',
  },
  guide: {
    fr: '🧭 Mode Guide activé. Un instant, je prépare votre exploration...',
    en: '🧭 Guide mode activated. One moment, preparing your exploration...',
  },
}

// --- Typing indicator text (shown while waiting for AI) ---

export const THINKING: Messages = {
  fr: '💭 Réflexion en cours...',
  en: '💭 Thinking...',
}

// --- Utility ---

/**
 * Get a message in the user's language, falling back to French.
 */
export function t(messages: Messages, lang: TelegramLanguage): string {
  return messages[lang] ?? messages.fr
}

/**
 * Detect language from Telegram's language_code field.
 * Maps fr/fr-* to 'fr', everything else to 'en'.
 */
export function detectLanguage(
  languageCode: string | undefined
): TelegramLanguage {
  if (!languageCode) return 'fr'
  return languageCode.startsWith('fr') ? 'fr' : 'en'
}
