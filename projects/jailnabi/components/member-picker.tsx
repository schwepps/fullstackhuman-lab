'use client'

import { useState, useEffect } from 'react'
import type { Member } from '@/lib/types'
import { MEMBERS } from '@/lib/members'
import { BASE_PATH } from '@/lib/constants'

interface MemberPickerProps {
  onSelect: (memberId: string, memberName: string) => Promise<boolean>
}

export function MemberPicker({ onSelect }: MemberPickerProps) {
  const [selected, setSelected] = useState<Member | null>(null)
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch claimed members on mount
  useEffect(() => {
    async function fetchClaims() {
      try {
        const res = await fetch(`${BASE_PATH}/api/session`)
        if (res.ok) {
          const data = await res.json()
          setClaimedIds(new Set(Object.keys(data.claims)))
        }
      } catch {
        // Offline — allow all selections
      }
    }
    fetchClaims()
  }, [])

  function handleSelect(member: Member) {
    if (claimedIds.has(member.id)) return
    setSelected(member)
    setError(null)
  }

  async function handleConfirm() {
    if (!selected || isConfirming) return
    setIsConfirming(true)
    setError(null)

    const success = await onSelect(selected.id, selected.name)
    if (!success) {
      setError(
        `${selected.name} was just claimed by another player. Pick someone else!`
      )
      setClaimedIds((prev) => new Set([...prev, selected.id]))
      setSelected(null)
    }

    setIsConfirming(false)
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

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        role="group"
        aria-label="Hanabi members"
      >
        {MEMBERS.map((member) => {
          const isClaimed = claimedIds.has(member.id)
          const isSelected = selected?.id === member.id

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member)}
              disabled={isClaimed}
              className={`card card-hover flex flex-col items-center gap-2 p-4 touch-manipulation ${
                isSelected ? 'border-primary bg-primary-muted' : ''
              } ${isClaimed ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={`${member.name}${isClaimed ? ' (taken)' : ''}`}
              aria-pressed={isSelected}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                  isSelected
                    ? 'bg-primary text-background'
                    : isClaimed
                      ? 'bg-border text-muted-foreground'
                      : 'bg-surface-hover text-muted-foreground'
                }`}
              >
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <span className="text-sm font-medium leading-tight text-center">
                {member.name}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {member.role}
              </span>
              {isClaimed && (
                <span className="text-xs font-semibold text-accent">
                  In the Yard
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-danger" role="alert">
          {error}
        </p>
      )}

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
            disabled={isConfirming}
            className="btn btn-primary min-w-48"
          >
            {isConfirming ? 'Entering...' : 'Enter The Yard'}
          </button>
        </div>
      )}
    </div>
  )
}
