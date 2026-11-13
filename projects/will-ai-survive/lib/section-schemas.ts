import { z } from 'zod'

export const SECTION_REGEX =
  /<(chaos_rating|timeline_entry|breaking_point|resignation|real_talk)>\s*([\s\S]*?)\s*<\/\1>/g

const MIN_CHAOS = 1
const MAX_CHAOS = 10
const DEFAULT_CHAOS = 5

const requiredText = z.string().trim().min(1)
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || undefined)
const textOrNumber = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())

const chaosRating = z
  .preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().catch(DEFAULT_CHAOS)
  )
  .transform((n) => Math.min(MAX_CHAOS, Math.max(MIN_CHAOS, n)))

const calendarUnit = z
  .enum(['hour', 'day', 'week', 'month'])
  .optional()
  .catch(undefined)
const period = z.coerce.number().int().min(1).optional().catch(undefined)

const SECTION_SCHEMAS = {
  chaos_rating: z.object({
    chaosRating,
    chaosLabel: requiredText,
    survivalDuration: requiredText,
    calendarUnit,
    empathyNote: optionalText,
  }),
  timeline_entry: z.object({
    time: textOrNumber,
    period,
    event: requiredText,
    thought: optionalText,
    sanityLevel: textOrNumber,
  }),
  breaking_point: z.object({ breakingPoint: requiredText }),
  resignation: z.object({
    resignationLetter: requiredText,
    oneLineSummary: z.string().trim().catch(''),
  }),
  real_talk: z.object({ insight: z.string().trim().catch('') }),
}

type SectionSchemas = typeof SECTION_SCHEMAS
export type SectionName = keyof SectionSchemas

export type ParsedSection = {
  [K in SectionName]: { name: K; data: z.output<SectionSchemas[K]> }
}[SectionName]

function isSectionName(name: string): name is SectionName {
  return Object.hasOwn(SECTION_SCHEMAS, name)
}

export function parseSection(
  name: string,
  data: unknown
): ParsedSection | null {
  if (!isSectionName(name)) return null
  const result = SECTION_SCHEMAS[name].safeParse(data)
  if (!result.success) return null
  return { name, data: result.data } as ParsedSection
}
