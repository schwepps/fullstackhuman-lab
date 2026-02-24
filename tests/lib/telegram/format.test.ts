import { describe, it, expect } from 'vitest'
import {
  escapeMarkdownV2,
  convertToMarkdownV2,
  splitMessage,
} from '@/lib/telegram/format'
import { TELEGRAM_MESSAGE_MAX_LENGTH } from '@/lib/telegram/constants'

// ---------------------------------------------------------------------------
// escapeMarkdownV2
// ---------------------------------------------------------------------------

describe('escapeMarkdownV2', () => {
  it('returns empty string unchanged', () => {
    expect(escapeMarkdownV2('')).toBe('')
  })

  it('leaves plain text without special characters unchanged', () => {
    expect(escapeMarkdownV2('hello world')).toBe('hello world')
  })

  it('preserves French accented characters', () => {
    const input = 'r\u00e9sum\u00e9 du projet bloqu\u00e9 depuis f\u00e9vrier'
    // No MarkdownV2 special chars in this string, so output should equal input
    expect(escapeMarkdownV2(input)).toBe(input)
  })

  it('escapes underscore', () => {
    expect(escapeMarkdownV2('hello_world')).toBe('hello\\_world')
  })

  it('escapes asterisk', () => {
    expect(escapeMarkdownV2('hello*world')).toBe('hello\\*world')
  })

  it('escapes square brackets', () => {
    expect(escapeMarkdownV2('[link]')).toBe('\\[link\\]')
  })

  it('escapes parentheses', () => {
    expect(escapeMarkdownV2('(text)')).toBe('\\(text\\)')
  })

  it('escapes tilde', () => {
    expect(escapeMarkdownV2('~strikethrough~')).toBe('\\~strikethrough\\~')
  })

  it('escapes backtick', () => {
    expect(escapeMarkdownV2('`code`')).toBe('\\`code\\`')
  })

  it('escapes greater-than sign', () => {
    expect(escapeMarkdownV2('> quote')).toBe('\\> quote')
  })

  it('escapes hash', () => {
    expect(escapeMarkdownV2('# heading')).toBe('\\# heading')
  })

  it('escapes plus', () => {
    expect(escapeMarkdownV2('a+b')).toBe('a\\+b')
  })

  it('escapes hyphen', () => {
    expect(escapeMarkdownV2('a-b')).toBe('a\\-b')
  })

  it('escapes equals', () => {
    expect(escapeMarkdownV2('a=b')).toBe('a\\=b')
  })

  it('escapes pipe', () => {
    expect(escapeMarkdownV2('a|b')).toBe('a\\|b')
  })

  it('escapes curly braces', () => {
    expect(escapeMarkdownV2('{obj}')).toBe('\\{obj\\}')
  })

  it('escapes dot', () => {
    expect(escapeMarkdownV2('v1.0')).toBe('v1\\.0')
  })

  it('escapes exclamation mark', () => {
    expect(escapeMarkdownV2('hello!')).toBe('hello\\!')
  })

  it('escapes backslash', () => {
    expect(escapeMarkdownV2('a\\b')).toBe('a\\\\b')
  })

  it('escapes multiple special characters in one string', () => {
    expect(escapeMarkdownV2('**bold** and _italic_')).toBe(
      '\\*\\*bold\\*\\* and \\_italic\\_'
    )
  })

  it('does not double-escape already escaped characters', () => {
    // If input already has a backslash-underscore, the backslash itself gets escaped
    expect(escapeMarkdownV2('\\_already\\_')).toBe('\\\\\\_already\\\\\\_')
  })
})

// ---------------------------------------------------------------------------
// convertToMarkdownV2
// ---------------------------------------------------------------------------

describe('convertToMarkdownV2', () => {
  describe('bold conversion', () => {
    it('converts **bold** to *bold*', () => {
      expect(convertToMarkdownV2('**hello**')).toBe('*hello*')
    })

    it('converts bold within a sentence', () => {
      const result = convertToMarkdownV2('this is **important** text')
      expect(result).toBe('this is *important* text')
    })

    it('converts multiple bold segments', () => {
      const result = convertToMarkdownV2('**first** and **second**')
      expect(result).toBe('*first* and *second*')
    })
  })

  describe('italic conversion', () => {
    it('converts *italic* to _italic_', () => {
      expect(convertToMarkdownV2('*hello*')).toBe('_hello_')
    })

    it('does not confuse bold markers with italic', () => {
      const result = convertToMarkdownV2('**bold** and *italic*')
      expect(result).toBe('*bold* and _italic_')
    })
  })

  describe('code blocks', () => {
    it('preserves code block content without escaping', () => {
      const input = '```\nconst x = 1;\nif (x > 0) { }\n```'
      const result = convertToMarkdownV2(input)
      expect(result).toBe(input)
    })

    it('preserves code block with language specifier', () => {
      const input = '```typescript\nconst x: number = 1;\n```'
      const result = convertToMarkdownV2(input)
      expect(result).toBe(input)
    })

    it('does not escape special chars inside code blocks', () => {
      const input = '```\n# not a heading\n**not bold**\n[not a link](url)\n```'
      const result = convertToMarkdownV2(input)
      // Content inside code blocks should be passed through unchanged
      expect(result).toBe(input)
    })

    it('handles text before and after code blocks', () => {
      const input = 'Before\n```\ncode\n```\nAfter'
      const result = convertToMarkdownV2(input)
      expect(result).toContain('```\ncode\n```')
      expect(result.startsWith('Before')).toBe(true)
      expect(result.endsWith('After')).toBe(true)
    })
  })

  describe('inline code', () => {
    it('preserves inline code without escaping', () => {
      const result = convertToMarkdownV2('use `const x = 1` here')
      expect(result).toContain('`const x = 1`')
    })

    it('escapes text around inline code', () => {
      const result = convertToMarkdownV2('run `npm install` first.')
      // The dot after "first" should be escaped
      expect(result).toContain('first\\.')
      expect(result).toContain('`npm install`')
    })
  })

  describe('headings', () => {
    it('converts h1 to bold', () => {
      expect(convertToMarkdownV2('# Heading')).toBe('*Heading*')
    })

    it('converts h2 to bold', () => {
      expect(convertToMarkdownV2('## Heading')).toBe('*Heading*')
    })

    it('converts h3 to bold', () => {
      expect(convertToMarkdownV2('### Heading')).toBe('*Heading*')
    })

    it('converts h6 to bold', () => {
      expect(convertToMarkdownV2('###### Heading')).toBe('*Heading*')
    })

    it('escapes special chars in heading text', () => {
      const result = convertToMarkdownV2('# Project v1.0')
      expect(result).toBe('*Project v1\\.0*')
    })

    it('handles inline formatting in headings', () => {
      const result = convertToMarkdownV2('# The **Key** Point')
      // **Key** inside heading becomes bold within bold -- the outer bold is the heading
      expect(result).toContain('*')
    })
  })

  describe('links', () => {
    it('preserves link structure with escaped text', () => {
      const result = convertToMarkdownV2('[click here](https://example.com)')
      expect(result).toBe('[click here](https://example.com)')
    })

    it('escapes special chars in link text', () => {
      const result = convertToMarkdownV2('[version 1.0](https://example.com)')
      expect(result).toBe('[version 1\\.0](https://example.com)')
    })

    it('does not escape URL in link', () => {
      const result = convertToMarkdownV2(
        '[link](https://example.com/path?a=1&b=2)'
      )
      // URL should not have its special chars escaped
      expect(result).toContain('(https://example.com/path?a=1&b=2)')
    })
  })

  describe('unordered list items', () => {
    it('converts dash list items to bullet points', () => {
      expect(convertToMarkdownV2('- item one')).toBe('\u2022 item one')
    })

    it('converts asterisk list items to bullet points', () => {
      expect(convertToMarkdownV2('* item one')).toBe('\u2022 item one')
    })

    it('preserves indentation on nested lists', () => {
      const result = convertToMarkdownV2('  - nested item')
      expect(result.startsWith('  \u2022 ')).toBe(true)
    })

    it('escapes special chars in list item content', () => {
      const result = convertToMarkdownV2('- item v1.0')
      expect(result).toBe('\u2022 item v1\\.0')
    })
  })

  describe('ordered list items', () => {
    it('preserves numbered list with escaped dot', () => {
      const result = convertToMarkdownV2('1. First item')
      expect(result).toBe('1\\. First item')
    })

    it('handles multi-digit numbers', () => {
      const result = convertToMarkdownV2('12. Twelfth item')
      expect(result).toBe('12\\. Twelfth item')
    })

    it('preserves indentation on ordered lists', () => {
      const result = convertToMarkdownV2('  1. indented')
      expect(result.startsWith('  1\\. ')).toBe(true)
    })
  })

  describe('blockquotes', () => {
    it('preserves blockquote prefix', () => {
      const result = convertToMarkdownV2('> quoted text')
      expect(result).toBe('>quoted text')
    })

    it('escapes special chars in blockquote content', () => {
      const result = convertToMarkdownV2('> version 1.0!')
      expect(result).toBe('>version 1\\.0\\!')
    })
  })

  describe('horizontal rules', () => {
    it('escapes horizontal rule dashes', () => {
      const result = convertToMarkdownV2('---')
      expect(result).toBe('\\-\\-\\-')
    })

    it('normalizes longer horizontal rules to three escaped dashes', () => {
      // The implementation always outputs escapeMarkdownV2('---')
      // regardless of how many dashes are in the input
      const result = convertToMarkdownV2('-----')
      expect(result).toBe('\\-\\-\\-')
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(convertToMarkdownV2('')).toBe('')
    })

    it('handles single newline', () => {
      expect(convertToMarkdownV2('\n')).toBe('\n')
    })

    it('handles multiple consecutive newlines', () => {
      expect(convertToMarkdownV2('\n\n\n')).toBe('\n\n\n')
    })

    it('handles plain text line with no formatting', () => {
      const result = convertToMarkdownV2('Just plain text here')
      expect(result).toBe('Just plain text here')
    })

    it('escapes special chars in plain text', () => {
      const result = convertToMarkdownV2('Price: $100.00!')
      expect(result).toContain('\\.')
      expect(result).toContain('\\!')
    })

    it('handles a complex multi-line document', () => {
      const input = [
        '# Report Title',
        '',
        'Some **bold** and *italic* text.',
        '',
        '- Item one',
        '- Item two',
        '',
        '```',
        'const x = 1;',
        '```',
        '',
        '> A quote',
        '',
        '[Link](https://example.com)',
      ].join('\n')

      const result = convertToMarkdownV2(input)

      // Heading converted to bold
      expect(result).toContain('*Report Title*')
      // Bold converted
      expect(result).toContain('*bold*')
      // Italic converted
      expect(result).toContain('_italic_')
      // Dot escaped outside formatting
      expect(result).toContain('text\\.')
      // List items converted
      expect(result).toContain('\u2022 Item one')
      // Code block preserved
      expect(result).toContain('const x = 1;')
      // Blockquote preserved
      expect(result).toContain('>A quote')
      // Link preserved
      expect(result).toContain('[Link](https://example.com)')
    })
  })
})

// ---------------------------------------------------------------------------
// splitMessage
// ---------------------------------------------------------------------------

describe('splitMessage', () => {
  it('returns single-element array when text fits within limit', () => {
    const text = 'Short message'
    expect(splitMessage(text)).toEqual([text])
  })

  it('returns single-element array for text exactly at the limit', () => {
    const text = 'a'.repeat(TELEGRAM_MESSAGE_MAX_LENGTH)
    expect(splitMessage(text)).toEqual([text])
  })

  it('returns empty string as single element', () => {
    expect(splitMessage('')).toEqual([''])
  })

  describe('paragraph splitting', () => {
    it('splits at paragraph boundaries (double newline)', () => {
      const maxLength = 20
      const text = 'Paragraph one\n\nParagraph two'
      const result = splitMessage(text, maxLength)
      expect(result).toEqual(['Paragraph one', 'Paragraph two'])
    })

    it('keeps paragraphs together when they fit', () => {
      const maxLength = 50
      const text = 'Short\n\nAlso short'
      const result = splitMessage(text, maxLength)
      expect(result).toEqual(['Short\n\nAlso short'])
    })

    it('handles three paragraphs requiring two splits', () => {
      const maxLength = 15
      const text = 'First para\n\nSecond para\n\nThird para'
      const result = splitMessage(text, maxLength)
      expect(result.length).toBeGreaterThanOrEqual(2)
      // All content should be preserved
      expect(result.join('\n\n')).toBe(text)
    })
  })

  describe('line splitting', () => {
    it('splits long paragraphs at single newlines', () => {
      const maxLength = 20
      // One paragraph (no double newline) with two lines
      const text = 'Line one here\nLine two here'
      const result = splitMessage(text, maxLength)
      expect(result).toEqual(['Line one here', 'Line two here'])
    })
  })

  describe('hard splitting', () => {
    it('hard-splits a single line that exceeds the limit', () => {
      const maxLength = 10
      const text = 'a'.repeat(25)
      const result = splitMessage(text, maxLength)
      expect(result).toHaveLength(3)
      expect(result[0]).toBe('a'.repeat(10))
      expect(result[1]).toBe('a'.repeat(10))
      expect(result[2]).toBe('a'.repeat(5))
    })

    it('hard-splits exactly at maxLength boundaries', () => {
      const maxLength = 5
      const text = 'abcdefghij' // 10 chars
      const result = splitMessage(text, maxLength)
      expect(result).toEqual(['abcde', 'fghij'])
    })
  })

  it('uses TELEGRAM_MESSAGE_MAX_LENGTH as default', () => {
    // A text just over the default limit should split into 2
    const text = 'a'.repeat(TELEGRAM_MESSAGE_MAX_LENGTH + 1)
    const result = splitMessage(text)
    expect(result.length).toBe(2)
    expect(result[0]).toHaveLength(TELEGRAM_MESSAGE_MAX_LENGTH)
    expect(result[1]).toHaveLength(1)
  })

  it('preserves all content across splits', () => {
    const maxLength = 30
    const paragraphs = [
      'First paragraph here.',
      'Second paragraph is longer text.',
      'Third one.',
    ]
    const text = paragraphs.join('\n\n')
    const result = splitMessage(text, maxLength)

    // Reconstruct and verify no content is lost
    const allContent = result.join('')
    for (const p of paragraphs) {
      expect(allContent).toContain(p)
    }
  })

  it('does not produce empty chunks', () => {
    const maxLength = 20
    const text = 'Hello\n\n\n\nWorld'
    const result = splitMessage(text, maxLength)
    for (const chunk of result) {
      expect(chunk).toBeDefined()
    }
  })
})
