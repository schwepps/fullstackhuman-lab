/** SSOT for fAIling Manifesto constants — used by page, schemas, sitemap, WebMCP. */

export const FAILING_PUBLISHED_DATE = '2026-03-04'

/** Roman numeral + translation key pairs for the 13 rules. */
export const FAILING_RULES = [
  { numeral: 'I', key: '1' },
  { numeral: 'II', key: '2' },
  { numeral: 'III', key: '3' },
  { numeral: 'IV', key: '4' },
  { numeral: 'V', key: '5' },
  { numeral: 'VI', key: '6' },
  { numeral: 'VII', key: '7' },
  { numeral: 'VIII', key: '8' },
  { numeral: 'IX', key: '9' },
  { numeral: 'X', key: '10' },
  { numeral: 'XI', key: '11' },
  { numeral: 'XII', key: '12' },
  { numeral: 'XIII', key: '13' },
] as const

export type FailingRuleKey = (typeof FAILING_RULES)[number]['key']

/**
 * English rule titles — keyed by translation key.
 * Canonical text lives in messages/en.json — keep in sync.
 * Run `pnpm check:seo` to verify.
 */
const RULE_TITLES: Record<FailingRuleKey, string> = {
  '1': 'Paste your entire codebase into the prompt',
  '2': 'Replace your roadmap with a prompt',
  '3': 'Automate before you understand',
  '4': 'If the AI wrote it and it compiles, ship it',
  '5': 'Announce the AI transformation on Monday. Expect results by Friday.',
  '6': 'The demo is the product',
  '7': 'Hallucinations are just creative suggestions',
  '8': 'Fire your domain experts. Hire prompt engineers.',
  '9': 'Let the AI own the strategy',
  '10': 'One mega-prompt to rule them all',
  '11': 'Measure ROI after 48 hours',
  '12': 'Put "AI-Powered" on everything',
  '13': 'Skip the guardrails. Move fast.',
}

/** Formatted rule titles with roman numerals for WebMCP registration. */
export const FAILING_RULE_TITLES_EN = FAILING_RULES.map(
  ({ numeral, key }) => `${numeral}. ${RULE_TITLES[key]}`
)
