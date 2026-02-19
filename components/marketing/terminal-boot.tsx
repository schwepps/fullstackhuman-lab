'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import {
  BOOT_LINES,
  BOOT_INITIAL_DELAY_MS,
  LINE_PAUSE_MS,
  STATUS_FLASH_DELAY_MS,
} from '@/lib/constants/boot-sequence'
import type { BootSequenceProps } from '@/types/marketing'

interface LineState {
  displayedText: string
  showStatus: boolean
}

export function TerminalBoot({ onComplete }: BootSequenceProps) {
  const t = useTranslations('boot')
  const [lines, setLines] = useState<LineState[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)
  const isCompleteRef = useRef(false)

  const translatedLines = useMemo(
    () =>
      BOOT_LINES.map((line) => ({
        ...line,
        text: t(`${line.key}.text` as Parameters<typeof t>[0]),
        status: t(`${line.key}.status` as Parameters<typeof t>[0]),
      })),
    [t]
  )

  const skipToEnd = useCallback(() => {
    if (isCompleteRef.current) return
    isCompleteRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)

    setLines(
      translatedLines.map((line) => ({
        displayedText: line.text,
        showStatus: true,
      }))
    )
    setIsComplete(true)
    setTimeout(onComplete, STATUS_FLASH_DELAY_MS)
  }, [onComplete, translatedLines])

  // Main animation driver — single effect, all setState in timer callbacks
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) {
      setTimeout(skipToEnd, 0)
      return
    }

    let lineIndex = 0
    let charIdx = 0

    function typeLine() {
      if (isCompleteRef.current) return
      const line = translatedLines[lineIndex]

      // Push empty entry for this line
      setLines((prev) => [...prev, { displayedText: '', showStatus: false }])

      charIdx = 0
      intervalRef.current = setInterval(() => {
        charIdx++
        const currentLineIdx = lineIndex
        const currentCharIdx = charIdx

        setLines((prev) => {
          const updated = [...prev]
          updated[currentLineIdx] = {
            displayedText: line.text.slice(0, currentCharIdx),
            showStatus: false,
          }
          return updated
        })

        if (currentCharIdx >= line.text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)

          // Flash status after short delay
          setTimeout(() => {
            if (isCompleteRef.current) return
            setLines((prev) => {
              const updated = [...prev]
              updated[currentLineIdx] = {
                displayedText: line.text,
                showStatus: true,
              }
              return updated
            })

            // Advance to next line or finish
            if (currentLineIdx < translatedLines.length - 1) {
              setTimeout(() => {
                lineIndex++
                typeLine()
              }, LINE_PAUSE_MS)
            } else {
              isCompleteRef.current = true
              setIsComplete(true)
              setTimeout(onComplete, LINE_PAUSE_MS)
            }
          }, STATUS_FLASH_DELAY_MS)
        }
      }, line.typingSpeedMs)
    }

    // Delayed start
    const startTimer = setTimeout(typeLine, BOOT_INITIAL_DELAY_MS)

    return () => {
      clearTimeout(startTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [skipToEnd, onComplete, translatedLines])

  // Skip on click or keypress
  useEffect(() => {
    window.addEventListener('click', skipToEnd)
    window.addEventListener('keydown', skipToEnd)
    return () => {
      window.removeEventListener('click', skipToEnd)
      window.removeEventListener('keydown', skipToEnd)
    }
  }, [skipToEnd])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-2xl px-6 text-sm sm:text-base">
        {lines.map((line, i) => (
          <div key={i} className="mb-1 leading-relaxed">
            <span className="text-foreground/80">{line.displayedText}</span>
            {line.showStatus && (
              <span className="terminal-green-glow font-bold">
                {translatedLines[i].status}
              </span>
            )}
          </div>
        ))}
        {!isComplete && (
          <span className="inline-block animate-cursor-blink text-primary">
            _
          </span>
        )}
      </div>
    </motion.div>
  )
}
