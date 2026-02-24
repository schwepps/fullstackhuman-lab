'use client'

import { useTranslations } from 'next-intl'
import { FileCheck } from 'lucide-react'
import type { ConversationStatus } from '@/types/conversation'

interface ConversationStatusBadgeProps {
  status: ConversationStatus
  hasReport: boolean
}

const BADGE_STYLES: Record<
  string,
  { className: string; key: ConversationStatus }
> = {
  report: {
    className: 'bg-success/10 text-success border-success/20',
    key: 'completed',
  },
  active: {
    className: 'bg-warning/10 text-warning border-warning/20',
    key: 'active',
  },
  abandoned: {
    className: 'bg-primary/10 text-primary border-primary/20',
    key: 'abandoned',
  },
}

function getVariant(
  status: ConversationStatus,
  hasReport: boolean
): (typeof BADGE_STYLES)[string] {
  if (status === 'completed' && hasReport) return BADGE_STYLES.report
  if (status === 'active') return BADGE_STYLES.active
  return BADGE_STYLES.abandoned
}

export function ConversationStatusBadge({
  status,
  hasReport,
}: ConversationStatusBadgeProps) {
  const t = useTranslations('conversations.status')
  const variant = getVariant(status, hasReport)
  const isReport = status === 'completed' && hasReport

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] leading-tight ${variant.className}`}
    >
      {isReport && <FileCheck className="size-2.5 shrink-0" />}
      {t(variant.key)}
    </span>
  )
}
