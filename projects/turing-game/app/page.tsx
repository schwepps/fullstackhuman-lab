'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

function generateRoomCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 6).toLowerCase()
}

export default function GameHomePage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')

  const handleCreate = useCallback(() => {
    const code = generateRoomCode()
    router.push(`/${code}`)
  }, [router])

  const handleJoin = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = roomCode.trim().toLowerCase()
      if (!trimmed || !/^[a-z0-9]{1,20}$/.test(trimmed)) return
      router.push(`/${trimmed}`)
    },
    [roomCode, router]
  )

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="mx-auto w-full max-w-sm space-y-8 font-mono">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">
            {'> TURING_GAME'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find the AI among us
          </p>
        </div>

        {/* Create room */}
        <button
          type="button"
          onClick={handleCreate}
          className="h-14 w-full touch-manipulation font-mono font-bold text-base bg-primary text-background shadow-[0_0_12px_rgba(34,211,238,0.3)] transition-all active:scale-[0.98]"
        >
          {'> NEW_ROOM'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Join room */}
        <form onSubmit={handleJoin} className="space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{'>'}</span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              maxLength={20}
              placeholder="ROOM_CODE"
              className="h-11 flex-1 touch-manipulation border border-border bg-popover px-3 text-base uppercase text-foreground placeholder-muted-foreground focus:border-primary focus:shadow-[0_0_8px_rgba(34,211,238,0.15)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!roomCode.trim()}
            className={`h-11 w-full touch-manipulation font-bold transition-all active:scale-[0.98] ${
              roomCode.trim()
                ? 'border border-primary text-primary'
                : 'border border-border text-muted-foreground opacity-50'
            }`}
          >
            {'> JOIN_ROOM'}
          </button>
        </form>
      </div>
    </main>
  )
}
