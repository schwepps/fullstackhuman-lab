'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Manages keyboard interaction for modal dialogs:
 * - Escape key closes the modal
 * - Auto-focuses the modal element on mount
 */
export function useModalKeyboard(
  onClose: () => void,
  ref: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, ref])
}
