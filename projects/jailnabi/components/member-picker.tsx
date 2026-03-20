'use client'

import { useState } from 'react'
import type { Member } from '@/lib/types'
import { MEMBERS } from '@/lib/members'
import { MemberGrid } from './member-grid'

interface MemberPickerProps {
  onSelect: (memberId: string, memberName: string) => void
}

export function MemberPicker({ onSelect }: MemberPickerProps) {
  const [selected, setSelected] = useState<Member | null>(null)

  function handleSelect(member: Member) {
    setSelected(member)
  }

  function handleConfirm() {
    if (selected) {
      onSelect(selected.id, selected.name)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-black tracking-tight text-primary sm:text-4xl">
          JAILNABI
        </h1>
        <p className="text-lg text-muted-foreground">
          Who are you today, inmate?
        </p>
      </div>

      <MemberGrid
        members={MEMBERS}
        selectedId={selected?.id}
        onSelect={handleSelect}
      />

      {selected && (
        <div className="mt-6 flex flex-col items-center gap-3 animate-[slide-up_0.3s_ease-out]">
          <p className="text-sm text-muted-foreground">
            Playing as{' '}
            <span className="font-semibold text-foreground">
              {selected.name}
            </span>
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary min-w-[200px]"
          >
            Enter The Yard
          </button>
        </div>
      )}
    </div>
  )
}
