'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type HudPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const HUD_POSITIONS: readonly { position: HudPosition; key: string }[] = [
  { position: 'top-left', key: 'sysId' },
  { position: 'top-right', key: 'status' },
  { position: 'bottom-left', key: 'role' },
  { position: 'bottom-right', key: 'version' },
]

function HudLabel({ position, text }: { position: HudPosition; text: string }) {
  const isTop = position.startsWith('top')
  const isLeft = position.endsWith('left')

  return (
    <span
      className={cn(
        'absolute z-10 font-mono text-[10px] tracking-widest text-primary/60 sm:text-xs',
        isTop ? '-top-6' : '-bottom-6',
        isLeft ? 'left-0' : 'right-0'
      )}
    >
      {text}
    </span>
  )
}

function ViewfinderCorner({ position }: { position: HudPosition }) {
  const corners = {
    'top-left': 'top-0 left-0 border-t-2 border-l-2',
    'top-right': 'top-0 right-0 border-t-2 border-r-2',
    'bottom-left': 'bottom-0 left-0 border-b-2 border-l-2',
    'bottom-right': 'bottom-0 right-0 border-b-2 border-r-2',
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute h-6 w-6 border-primary/60 sm:h-8 sm:w-8',
        corners[position]
      )}
    />
  )
}

export function PortraitViewfinder() {
  const t = useTranslations('hud')

  return (
    <div className="relative mx-auto w-fit">
      {/* HUD labels */}
      {HUD_POSITIONS.map((label) => (
        <HudLabel
          key={label.position}
          position={label.position}
          text={t(label.key as 'sysId' | 'status' | 'role' | 'version')}
        />
      ))}

      {/* Viewfinder frame */}
      <div className="group relative cursor-pointer">
        {/* Corner brackets */}
        <ViewfinderCorner position="top-left" />
        <ViewfinderCorner position="top-right" />
        <ViewfinderCorner position="bottom-left" />
        <ViewfinderCorner position="bottom-right" />

        {/* Crosshair lines */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute top-1/2 left-0 h-px w-full bg-primary/10" />
          <div className="absolute top-0 left-1/2 h-full w-px bg-primary/10" />
        </div>

        {/* Portrait image */}
        <div className="relative h-64 w-48 overflow-hidden sm:h-72 sm:w-54">
          <Image
            src="/images/fullstackhuman.png"
            alt="François Schuers"
            fill
            priority
            sizes="(max-width: 640px) 192px, 216px"
            className={cn(
              'object-cover object-top',
              'contrast-[1.2] brightness-[0.9]',
              'transition-[filter] duration-150',
              'group-hover:brightness-110 group-hover:contrast-[1.3] group-hover:animate-flicker',
              'group-active:brightness-110 group-active:contrast-[1.3]'
            )}
          />

          {/* Cyan grid overlay */}
          <div className="viewfinder-grid pointer-events-none absolute inset-0 z-10 mix-blend-screen" />

          {/* Image scanline overlay */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-size-[100%_4px]" />
        </div>
      </div>
    </div>
  )
}
