import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CHAT_INPUT_MAX_LENGTH } from '@/lib/constants/chat'

// Mock the shared sanitize dependency
vi.mock('@/lib/ai/sanitize', () => ({
  sanitizeMessageContent: vi.fn((content: string) => content),
}))

import {
  sanitizeTelegramMessage,
  stripBidiChars,
  sanitizeStartParam,
} from '@/lib/telegram/sanitize'
import { sanitizeMessageContent } from '@/lib/ai/sanitize'

const mockedSanitize = vi.mocked(sanitizeMessageContent)

beforeEach(() => {
  mockedSanitize.mockReset()
  mockedSanitize.mockImplementation((content: string) => content)
})

// ---------------------------------------------------------------------------
// sanitizeTelegramMessage
// ---------------------------------------------------------------------------

describe('sanitizeTelegramMessage', () => {
  describe('basic input handling', () => {
    it('returns null for undefined input', () => {
      expect(sanitizeTelegramMessage(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(sanitizeTelegramMessage('')).toBeNull()
    })

    it('returns trimmed text for valid input', () => {
      expect(sanitizeTelegramMessage('Hello world')).toBe('Hello world')
    })

    it('returns null for whitespace-only input', () => {
      expect(sanitizeTelegramMessage('   ')).toBeNull()
    })

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeTelegramMessage('  hello  ')).toBe('hello')
    })
  })

  describe('max length enforcement', () => {
    it('returns null when text exceeds CHAT_INPUT_MAX_LENGTH', () => {
      const tooLong = 'a'.repeat(CHAT_INPUT_MAX_LENGTH + 1)
      expect(sanitizeTelegramMessage(tooLong)).toBeNull()
    })

    it('accepts text exactly at CHAT_INPUT_MAX_LENGTH', () => {
      const exact = 'a'.repeat(CHAT_INPUT_MAX_LENGTH)
      expect(sanitizeTelegramMessage(exact)).toBe(exact)
    })

    it('accepts text under CHAT_INPUT_MAX_LENGTH', () => {
      const short = 'a'.repeat(100)
      expect(sanitizeTelegramMessage(short)).toBe(short)
    })
  })

  describe('command stripping', () => {
    it('strips /start command and returns remaining text', () => {
      expect(sanitizeTelegramMessage('/start hello')).toBe('hello')
    })

    it('strips /help command', () => {
      expect(sanitizeTelegramMessage('/help with something')).toBe(
        'with something'
      )
    })

    it('strips command with bot mention (/help@BotName)', () => {
      expect(sanitizeTelegramMessage('/help@MyBot tell me something')).toBe(
        'tell me something'
      )
    })

    it('returns null for command-only message (/start)', () => {
      expect(sanitizeTelegramMessage('/start')).toBeNull()
    })

    it('returns null for command-only with trailing space', () => {
      expect(sanitizeTelegramMessage('/start ')).toBeNull()
    })

    it('returns null for command with bot mention only', () => {
      expect(sanitizeTelegramMessage('/reset@MyBot')).toBeNull()
    })

    it('strips /start with deep link parameter', () => {
      expect(sanitizeTelegramMessage('/start deeplink_param')).toBe(
        'deeplink_param'
      )
    })

    it('does not strip commands in the middle of text', () => {
      expect(sanitizeTelegramMessage('please /help me')).toBe('please /help me')
    })
  })

  describe('sanitization integration', () => {
    it('calls sanitizeMessageContent with command-stripped text', () => {
      sanitizeTelegramMessage('/start real message')
      expect(mockedSanitize).toHaveBeenCalledWith('real message')
    })

    it('calls sanitizeMessageContent for plain messages', () => {
      sanitizeTelegramMessage('plain message')
      expect(mockedSanitize).toHaveBeenCalledWith('plain message')
    })

    it('returns null when sanitizeMessageContent returns only whitespace', () => {
      mockedSanitize.mockReturnValue('   ')
      expect(sanitizeTelegramMessage('some input')).toBeNull()
    })

    it('returns null when sanitizeMessageContent returns empty string', () => {
      mockedSanitize.mockReturnValue('')
      expect(sanitizeTelegramMessage('some input')).toBeNull()
    })

    it('returns trimmed result from sanitizeMessageContent', () => {
      mockedSanitize.mockReturnValue('  cleaned text  ')
      expect(sanitizeTelegramMessage('raw input')).toBe('cleaned text')
    })
  })
})

// ---------------------------------------------------------------------------
// stripBidiChars
// ---------------------------------------------------------------------------

describe('stripBidiChars', () => {
  it('returns plain text unchanged', () => {
    expect(stripBidiChars('hello world')).toBe('hello world')
  })

  it('returns empty string unchanged', () => {
    expect(stripBidiChars('')).toBe('')
  })

  it('strips left-to-right embedding (U+202A)', () => {
    expect(stripBidiChars('hello\u202Aworld')).toBe('helloworld')
  })

  it('strips right-to-left embedding (U+202B)', () => {
    expect(stripBidiChars('hello\u202Bworld')).toBe('helloworld')
  })

  it('strips left-to-right override (U+202D)', () => {
    expect(stripBidiChars('hello\u202Dworld')).toBe('helloworld')
  })

  it('strips right-to-left override (U+202E)', () => {
    expect(stripBidiChars('hello\u202Eworld')).toBe('helloworld')
  })

  it('strips pop directional formatting (U+202C)', () => {
    expect(stripBidiChars('hello\u202Cworld')).toBe('helloworld')
  })

  it('strips left-to-right isolate (U+2066)', () => {
    expect(stripBidiChars('hello\u2066world')).toBe('helloworld')
  })

  it('strips right-to-left isolate (U+2067)', () => {
    expect(stripBidiChars('hello\u2067world')).toBe('helloworld')
  })

  it('strips first strong isolate (U+2068)', () => {
    expect(stripBidiChars('hello\u2068world')).toBe('helloworld')
  })

  it('strips pop directional isolate (U+2069)', () => {
    expect(stripBidiChars('hello\u2069world')).toBe('helloworld')
  })

  it('strips multiple bidi characters at once', () => {
    expect(stripBidiChars('\u202Ahello\u202Eworld\u2066!')).toBe('helloworld!')
  })

  it('preserves non-bidi unicode characters', () => {
    expect(stripBidiChars('caf\u00e9 \u00e9l\u00e8ve')).toBe(
      'caf\u00e9 \u00e9l\u00e8ve'
    )
  })

  it('preserves emojis', () => {
    expect(stripBidiChars('hello \ud83d\ude00')).toBe('hello \ud83d\ude00')
  })
})

// ---------------------------------------------------------------------------
// sanitizeStartParam
// ---------------------------------------------------------------------------

describe('sanitizeStartParam', () => {
  describe('valid parameters', () => {
    it('accepts alphanumeric string', () => {
      expect(sanitizeStartParam('abc123')).toBe('abc123')
    })

    it('accepts string with hyphens', () => {
      expect(sanitizeStartParam('my-param')).toBe('my-param')
    })

    it('accepts string with underscores', () => {
      expect(sanitizeStartParam('my_param')).toBe('my_param')
    })

    it('accepts mixed valid characters', () => {
      expect(sanitizeStartParam('test-Param_123')).toBe('test-Param_123')
    })

    it('accepts single character', () => {
      expect(sanitizeStartParam('a')).toBe('a')
    })

    it('accepts string of exactly 64 characters', () => {
      const param = 'a'.repeat(64)
      expect(sanitizeStartParam(param)).toBe(param)
    })
  })

  describe('invalid parameters', () => {
    it('returns null for undefined', () => {
      expect(sanitizeStartParam(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(sanitizeStartParam('')).toBeNull()
    })

    it('returns null for string exceeding 64 characters', () => {
      const tooLong = 'a'.repeat(65)
      expect(sanitizeStartParam(tooLong)).toBeNull()
    })

    it('returns null for string with spaces', () => {
      expect(sanitizeStartParam('has space')).toBeNull()
    })

    it('returns null for string with special characters', () => {
      expect(sanitizeStartParam('test@param')).toBeNull()
    })

    it('returns null for string with dots', () => {
      expect(sanitizeStartParam('test.param')).toBeNull()
    })

    it('returns null for string with slashes', () => {
      expect(sanitizeStartParam('test/param')).toBeNull()
    })

    it('returns null for string with unicode characters', () => {
      expect(sanitizeStartParam('param\u00e9')).toBeNull()
    })

    it('returns null for string with emoji', () => {
      expect(sanitizeStartParam('test\ud83d\ude00')).toBeNull()
    })
  })
})
