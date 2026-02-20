import type { TierKey, UserTier } from '@/lib/constants/quotas'

export type { TierKey, UserTier }

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  tier: UserTier
  conversation_count_month: number
  conversation_count_reset_at: string
  created_at: string
  updated_at: string
}

export interface QuotaInfo {
  remaining: number | null
  limit: number | null
  tier: TierKey
  period: 'day' | 'month'
}

export type QuotaPeriod = QuotaInfo['period']
