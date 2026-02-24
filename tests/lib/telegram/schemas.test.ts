import { describe, it, expect } from 'vitest'
import { telegramUpdateSchema } from '@/lib/telegram/schemas'

// ---------------------------------------------------------------------------
// Helper factories for valid payloads
// ---------------------------------------------------------------------------

function validUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 123456789,
    is_bot: false,
    first_name: 'John',
    ...overrides,
  }
}

function validChat(overrides: Record<string, unknown> = {}) {
  return {
    id: 123456789,
    type: 'private' as const,
    ...overrides,
  }
}

function validMessageUpdate(overrides: Record<string, unknown> = {}) {
  return {
    update_id: 1001,
    message: {
      message_id: 42,
      from: validUser(),
      chat: validChat(),
      date: 1700000000,
      text: 'Hello bot',
      ...overrides,
    },
  }
}

function validCallbackQueryUpdate(overrides: Record<string, unknown> = {}) {
  return {
    update_id: 1002,
    callback_query: {
      id: 'callback-id-123',
      from: validUser(),
      message: {
        chat: validChat(),
      },
      data: 'persona:doctor',
      ...overrides,
    },
  }
}

// ---------------------------------------------------------------------------
// telegramUpdateSchema
// ---------------------------------------------------------------------------

describe('telegramUpdateSchema', () => {
  describe('valid message updates', () => {
    it('accepts a complete valid message update', () => {
      const result = telegramUpdateSchema.safeParse(validMessageUpdate())
      expect(result.success).toBe(true)
    })

    it('accepts message without text (photo, sticker, etc.)', () => {
      const payload = validMessageUpdate()
      delete (payload.message as Record<string, unknown>).text
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('accepts message with entities', () => {
      const payload = validMessageUpdate({
        entities: [{ type: 'bot_command', offset: 0, length: 6 }],
      })
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('accepts message with optional user fields', () => {
      const payload = {
        update_id: 1001,
        message: {
          message_id: 42,
          from: validUser({
            last_name: 'Doe',
            username: 'johndoe',
            language_code: 'en',
          }),
          chat: validChat(),
          date: 1700000000,
          text: 'Hello',
        },
      }
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message?.from.last_name).toBe('Doe')
        expect(result.data.message?.from.username).toBe('johndoe')
        expect(result.data.message?.from.language_code).toBe('en')
      }
    })
  })

  describe('valid callback query updates', () => {
    it('accepts a complete valid callback query update', () => {
      const result = telegramUpdateSchema.safeParse(validCallbackQueryUpdate())
      expect(result.success).toBe(true)
    })

    it('accepts callback query without message', () => {
      const payload = validCallbackQueryUpdate()
      delete (payload.callback_query as Record<string, unknown>).message
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('accepts callback query without data', () => {
      const payload = validCallbackQueryUpdate()
      delete (payload.callback_query as Record<string, unknown>).data
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })

  describe('update with neither message nor callback_query', () => {
    it('accepts update with only update_id (e.g. edited_message, channel_post)', () => {
      const result = telegramUpdateSchema.safeParse({ update_id: 1003 })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid payloads', () => {
    it('rejects payload without update_id', () => {
      const result = telegramUpdateSchema.safeParse({
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects payload with non-positive update_id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 0,
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects payload with string update_id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 'not-a-number',
      })
      expect(result.success).toBe(false)
    })

    it('rejects message with missing from field', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects message with missing chat field', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects message with missing message_id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          from: validUser(),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects message with missing date', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat(),
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects user with negative id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ id: -1 }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects user with non-integer id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ id: 1.5 }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects user with string id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ id: 'not-a-number' }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects user with is_bot as string', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ is_bot: 'false' }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects callback_query with missing id', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1002,
        callback_query: {
          from: validUser(),
          data: 'test',
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects callback_query with missing from', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1002,
        callback_query: {
          id: 'callback-123',
          data: 'test',
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-object payload', () => {
      expect(telegramUpdateSchema.safeParse('string').success).toBe(false)
      expect(telegramUpdateSchema.safeParse(42).success).toBe(false)
      expect(telegramUpdateSchema.safeParse(null).success).toBe(false)
      expect(telegramUpdateSchema.safeParse(undefined).success).toBe(false)
      expect(telegramUpdateSchema.safeParse([]).success).toBe(false)
    })
  })

  describe('chat type validation', () => {
    it('accepts private chat type', () => {
      const result = telegramUpdateSchema.safeParse(validMessageUpdate())
      expect(result.success).toBe(true)
    })

    it('accepts group chat type', () => {
      const payload = {
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat({ type: 'group' }),
          date: 1700000000,
        },
      }
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.message?.chat.type).toBe('group')
      }
    })

    it('accepts supergroup chat type', () => {
      const payload = {
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat({ type: 'supergroup' }),
          date: 1700000000,
        },
      }
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('accepts channel chat type', () => {
      const payload = {
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat({ type: 'channel' }),
          date: 1700000000,
        },
      }
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('rejects invalid chat type', () => {
      const payload = {
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser(),
          chat: validChat({ type: 'unknown' }),
          date: 1700000000,
        },
      }
      const result = telegramUpdateSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('string length constraints', () => {
    it('rejects first_name exceeding 256 characters', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ first_name: 'a'.repeat(257) }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects username exceeding 64 characters', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ username: 'a'.repeat(65) }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects language_code exceeding 10 characters', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1001,
        message: {
          message_id: 1,
          from: validUser({ language_code: 'a'.repeat(11) }),
          chat: validChat(),
          date: 1700000000,
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects message text exceeding 4096 characters', () => {
      const result = telegramUpdateSchema.safeParse(
        validMessageUpdate({ text: 'a'.repeat(4097) })
      )
      expect(result.success).toBe(false)
    })

    it('accepts message text of exactly 4096 characters', () => {
      const result = telegramUpdateSchema.safeParse(
        validMessageUpdate({ text: 'a'.repeat(4096) })
      )
      expect(result.success).toBe(true)
    })

    it('rejects callback data exceeding 64 characters', () => {
      const result = telegramUpdateSchema.safeParse({
        update_id: 1002,
        callback_query: {
          id: 'cb-123',
          from: validUser(),
          data: 'a'.repeat(65),
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects entity with non-positive length', () => {
      const result = telegramUpdateSchema.safeParse(
        validMessageUpdate({
          entities: [{ type: 'bot_command', offset: 0, length: 0 }],
        })
      )
      expect(result.success).toBe(false)
    })
  })
})
