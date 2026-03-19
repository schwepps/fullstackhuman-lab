'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { AUDIO, IMAGES } from '@/lib/constants'

const SEEK_STEP = 5

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AnthemPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasError, setHasError] = useState(false)

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying((prev) => {
      if (prev) {
        audio.pause()
      } else {
        audio.play().catch(() => setIsPlaying(false))
      }
      return !prev
    })
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress((audio.currentTime / audio.duration) * 100)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
  }, [])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      if (!audio || !duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = x / rect.width
      audio.currentTime = percent * duration
    },
    [duration]
  )

  const handleSliderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const audio = audioRef.current
      if (!audio || !duration) return
      if (e.key === 'ArrowRight')
        audio.currentTime = Math.min(audio.currentTime + SEEK_STEP, duration)
      else if (e.key === 'ArrowLeft')
        audio.currentTime = Math.max(audio.currentTime - SEEK_STEP, 0)
      else if (e.key === 'Home') audio.currentTime = 0
      else if (e.key === 'End') audio.currentTime = duration
    },
    [duration]
  )

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setProgress(0)
  }, [])

  const currentTime = duration ? (progress / 100) * duration : 0

  return (
    <section className="bg-surface border-y border-border/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div
          className="text-center text-xs uppercase tracking-[0.2em] text-gold mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ★ Le Parti vous offre la musique ! ★
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Album cover */}
          <div className="relative shrink-0 w-20 h-20 sm:w-28 sm:h-28 overflow-hidden border-2 border-primary/40">
            <Image
              src={IMAGES.sinan}
              alt="Hymne National du FlURSS"
              fill
              sizes="(max-width: 640px) 80px, 112px"
              className="object-cover"
            />
          </div>

          {/* Controls */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wider mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Hymne National du FlURSS
            </h3>
            <p className="text-xs text-muted mb-3">
              Compose par l&apos;Algorithme Supreme — Approuve par le Parti
            </p>

            {hasError ? (
              <p className="text-xs text-primary">
                Audio indisponible — le Parti enquete.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                {/* Play/Pause button */}
                <button
                  onClick={handlePlayPause}
                  className="shrink-0 w-11 h-11 flex items-center justify-center bg-primary hover:bg-primary-light transition-colors touch-manipulation active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Ecouter'}
                >
                  {isPlaying ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-foreground"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-foreground ml-0.5"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </button>

                {/* Progress bar */}
                <div className="flex-1 space-y-1">
                  <div
                    className="h-2 bg-border/50 cursor-pointer group"
                    onClick={handleSeek}
                    onKeyDown={handleSliderKeyDown}
                    role="slider"
                    aria-label="Position dans le morceau"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    tabIndex={0}
                  >
                    <div
                      className="h-full bg-primary transition-[width] duration-200 group-hover:bg-primary-light"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration ? formatTime(duration) : '--:--'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={AUDIO.anthem}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />
    </section>
  )
}
