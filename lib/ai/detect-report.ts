import { PERSONAS } from '@/lib/constants/personas'
import type { PersonaId } from '@/types/chat'

/**
 * Detect whether text contains a report for the given persona.
 * Tests against the persona's report detection regex pattern.
 *
 * SSOT: shared between web chat (use-chat.ts) and Telegram (ai-service.ts).
 */
export function detectReport(text: string, persona: PersonaId): boolean {
  return PERSONAS[persona].reportDetectPattern.test(text)
}
