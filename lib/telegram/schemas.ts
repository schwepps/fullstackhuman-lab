import { z } from 'zod/v4'

/**
 * Zod schemas for validating Telegram webhook update payloads.
 * Validates structure before accessing any nested property to prevent
 * type confusion and JSONB injection via malformed payloads.
 */

const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  is_bot: z.boolean(),
  first_name: z.string().max(256),
  last_name: z.string().max(256).optional(),
  username: z.string().max(64).optional(),
  language_code: z.string().max(10).optional(),
})

const telegramChatSchema = z.object({
  id: z.number().int(),
  type: z.enum(['private', 'group', 'supergroup', 'channel']),
})

const telegramMessageSchema = z.object({
  message_id: z.number().int().positive(),
  from: telegramUserSchema,
  chat: telegramChatSchema,
  date: z.number().int().positive(),
  text: z.string().max(4096).optional(),
  entities: z
    .array(
      z.object({
        type: z.string(),
        offset: z.number().int(),
        length: z.number().int().positive(),
      })
    )
    .optional(),
})

const telegramCallbackQuerySchema = z.object({
  id: z.string(),
  from: telegramUserSchema,
  message: z
    .object({
      chat: telegramChatSchema,
    })
    .optional(),
  data: z.string().max(64).optional(),
})

export const telegramUpdateSchema = z.object({
  update_id: z.number().int().positive(),
  message: telegramMessageSchema.optional(),
  callback_query: telegramCallbackQuerySchema.optional(),
})

export type ValidatedTelegramUpdate = z.infer<typeof telegramUpdateSchema>
export type ValidatedTelegramMessage = z.infer<typeof telegramMessageSchema>
export type ValidatedTelegramUser = z.infer<typeof telegramUserSchema>
export type ValidatedCallbackQuery = z.infer<typeof telegramCallbackQuerySchema>
