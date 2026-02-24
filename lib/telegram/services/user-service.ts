import { detectLanguage } from '@/lib/telegram/i18n'
import { upsertTelegramUser } from '@/lib/telegram/db'
import type { TelegramUserRow } from '@/lib/telegram/types'

/**
 * Get or create a Telegram user by their Telegram ID.
 * Detects language from the Telegram language_code, then upserts the user row.
 * Returns null if the DB operation fails.
 */
export async function getOrCreateTelegramUser(
  telegramId: number,
  languageCode: string | undefined
): Promise<TelegramUserRow | null> {
  const language = detectLanguage(languageCode)
  return upsertTelegramUser(telegramId, language)
}
