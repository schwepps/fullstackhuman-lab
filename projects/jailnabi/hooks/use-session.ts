'use client'

import { useState, useCallback, useMemo } from 'react'

const DEVICE_ID_KEY = 'jailnabi-device-id'
const PLAYER_NAME_KEY = 'jailnabi-player-name'

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function getSavedName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(PLAYER_NAME_KEY) ?? ''
}

export function useSession() {
  const [sessionId] = useState(getOrCreateDeviceId)
  const [playerName, setPlayerName] = useState(getSavedName)

  const updateName = useCallback((name: string) => {
    setPlayerName(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PLAYER_NAME_KEY, name)
    }
  }, [])

  return useMemo(
    () => ({ sessionId, playerName, updateName }),
    [sessionId, playerName, updateName]
  )
}
