import { z } from 'zod'
import { MIN_SITUATION_LENGTH, MAX_SITUATION_LENGTH } from './constants'

export const situationSchema = z
  .string()
  .trim()
  .min(MIN_SITUATION_LENGTH, `At least ${MIN_SITUATION_LENGTH} characters`)
  .max(MAX_SITUATION_LENGTH, `Maximum ${MAX_SITUATION_LENGTH} characters`)

/** Validates nanoid format used for result IDs */
export const RESULT_ID_PATTERN = /^[A-Za-z0-9_-]{12,}$/
