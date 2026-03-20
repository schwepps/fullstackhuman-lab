'use client'

import type { Member } from '@/lib/types'

interface MemberCardProps {
  member: Member
  convictionCount?: number
  isSelected?: boolean
  onClick?: () => void
}

export function MemberCard({
  member,
  convictionCount = 0,
  isSelected = false,
  onClick,
}: MemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      className={`card card-hover flex flex-col items-center gap-2 p-4 touch-manipulation ${
        isSelected ? 'border-primary bg-primary-muted' : ''
      }`}
      aria-label={`${member.name}, ${member.role}${convictionCount > 0 ? `, ${convictionCount} conviction${convictionCount === 1 ? '' : 's'}` : ''}`}
      aria-pressed={isSelected}
    >
      {/* Avatar with initials */}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
          isSelected
            ? 'bg-primary text-background'
            : 'bg-surface-hover text-muted-foreground'
        }`}
      >
        {initials}
      </div>

      {/* Name */}
      <span className="text-sm font-medium leading-tight text-center">
        {member.name}
      </span>

      {/* Role */}
      <span className="text-xs text-muted-foreground line-clamp-1">
        {member.role}
      </span>

      {/* Conviction badge */}
      {convictionCount > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-danger-muted px-2 py-0.5 text-xs font-semibold text-danger"
          aria-label={`${convictionCount} conviction${convictionCount === 1 ? '' : 's'}`}
        >
          {convictionCount}x
        </span>
      )}
    </button>
  )
}
