// IMPORTANT: Free-tier limit (15) must match the CASE in use_conversation()
// in supabase/migrations/00000000000000_initial_schema.sql
export const TIER_QUOTAS = {
  anonymous: {
    maxConversationsPerDay: 3,
    maxConversationsPerMonth: null,
  },
  free: {
    maxConversationsPerDay: null,
    maxConversationsPerMonth: 15,
  },
  paid: {
    maxConversationsPerDay: null,
    maxConversationsPerMonth: null, // unlimited
  },
} as const

export type TierKey = keyof typeof TIER_QUOTAS

/** Tiers stored in DB (excludes 'anonymous' which is cookie-based) */
export type UserTier = Exclude<TierKey, 'anonymous'>

export const USER_TIERS = [
  'free',
  'paid',
] as const satisfies readonly UserTier[]
