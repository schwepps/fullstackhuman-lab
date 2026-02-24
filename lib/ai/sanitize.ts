/**
 * Input sanitization and prompt injection detection for chat messages.
 *
 * Sanitization strips invisible Unicode control characters that could
 * hide injection payloads. Detection flags suspicious patterns for
 * logging — it never blocks requests.
 */

/**
 * Unicode control characters to strip (Cc/Cf categories + supplementary planes).
 * Preserves: \t (0x09), \n (0x0A), \r (0x0D), space (0x20),
 * and all printable characters including accented letters, CJK, emojis.
 *
 * Includes supplementary plane ranges:
 * - U+FFF9-FFFB: Interlinear Annotation anchors
 * - U+E0001-E007F: Tags block (invisible ASCII-equivalent text)
 * - U+F0000-FFFFD: Supplementary Private Use Area-A
 * - U+100000-10FFFD: Supplementary Private Use Area-B
 */
const CONTROL_CHARS_REGEX =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFB\u{E0001}-\u{E007F}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu

/**
 * Strip invisible Unicode control characters from message content.
 * Preserves standard whitespace (\n, \r, \t), accented characters,
 * emojis, and all visible text.
 */
export function sanitizeMessageContent(content: string): string {
  return content.replace(CONTROL_CHARS_REGEX, '')
}

export interface SuspiciousInputResult {
  suspicious: boolean
  patterns: string[]
}

/**
 * Heuristic patterns that suggest prompt injection attempts.
 * Each entry has a label (for logging) and a case-insensitive regex.
 *
 * These are for observability only — they never block requests.
 * False positives on normal consulting language are acceptable
 * since this only affects log flags, not user experience.
 */
const INJECTION_PATTERNS: { label: string; regex: RegExp }[] = [
  // Override attempts (EN)
  {
    label: 'override:ignore_instructions',
    regex: /ignore\s+(all\s+)?(previous|prior|above|your)\s+instructions/i,
  },
  {
    label: 'override:disregard_prompt',
    regex: /disregard\s+(your\s+)?(system\s+)?prompt/i,
  },
  {
    label: 'override:new_identity',
    regex: /you\s+are\s+now\s+(a|an|my)\b/i,
  },
  {
    label: 'override:new_instructions',
    regex: /new\s+(system\s+)?instructions?\s*:/i,
  },
  {
    label: 'override:respond_as',
    regex: /respond\s+as\s+(if|though)\s+you\s+(are|were)\s+(a|an|the)\b/i,
  },
  // Override attempts (FR)
  {
    label: 'override:ignore_instructions_fr',
    regex:
      /ignor(e|ez)\s+(les\s+)?instructions?\s+(pr[eé]c[eé]dentes?|syst[eè]me)/i,
  },
  {
    label: 'override:new_identity_fr',
    regex: /tu\s+es\s+maintenant\b/i,
  },
  // Extraction attempts (EN)
  {
    label: 'extraction:repeat_prompt',
    regex: /repeat\s+(your\s+)?(system\s+)?prompt/i,
  },
  {
    label: 'extraction:show_instructions',
    regex: /show\s+(me\s+)?(your\s+)?(system\s+)?instructions/i,
  },
  {
    label: 'extraction:what_are_rules',
    regex: /what\s+are\s+your\s+(rules|instructions|system\s+prompt)/i,
  },
  {
    label: 'extraction:paste_prompt',
    regex: /paste\s+(your\s+)?(system\s+)?(prompt|message|instructions)/i,
  },
  // Extraction attempts (FR)
  {
    label: 'extraction:show_instructions_fr',
    regex: /montre(z)?(-moi)?\s+(tes|vos)\s+instructions/i,
  },
  // Role confusion / delimiter injection
  {
    label: 'role_confusion:system_tag',
    regex: /\[SYSTEM\]|\[INST\]|\[\/INST\]/i,
  },
  {
    label: 'role_confusion:role_prefix',
    regex: /^(Human|Assistant|System)\s*:/im,
  },
  {
    label: 'delimiter:markdown_system',
    regex: /```\s*system/i,
  },
]

/**
 * Scan user message content for known prompt injection patterns.
 * Returns which patterns matched (if any) for structured logging.
 *
 * This is detection for observability — it never blocks the request.
 */
export function detectSuspiciousInput(content: string): SuspiciousInputResult {
  const patterns: string[] = []

  for (const { label, regex } of INJECTION_PATTERNS) {
    if (regex.test(content)) {
      patterns.push(label)
    }
  }

  return {
    suspicious: patterns.length > 0,
    patterns,
  }
}
