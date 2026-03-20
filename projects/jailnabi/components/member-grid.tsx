'use client'

import type { Member } from '@/lib/types'
import { MemberCard } from './member-card'

interface MemberGridProps {
  members: Member[]
  selectedId?: string
  onSelect?: (member: Member) => void
  convictionCounts?: Record<string, number>
}

export function MemberGrid({
  members,
  selectedId,
  onSelect,
  convictionCounts = {},
}: MemberGridProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      role="group"
      aria-label="Hanabi members"
    >
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          convictionCount={convictionCounts[member.id] ?? 0}
          isSelected={selectedId === member.id}
          onClick={onSelect ? () => onSelect(member) : undefined}
        />
      ))}
    </div>
  )
}
