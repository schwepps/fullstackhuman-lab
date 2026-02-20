'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface AiAvatarProps {
  className?: string
}

export function AiAvatar({ className }: AiAvatarProps) {
  const t = useTranslations('chat')

  return (
    <div
      className={cn(
        'relative size-12 shrink-0 overflow-hidden rounded-full',
        'border border-primary/40 shadow-[0_0_6px_rgba(34,211,238,0.2)]',
        className
      )}
    >
      <Image
        src="/images/fullstackhuman.png"
        alt={t('avatarAlt')}
        fill
        sizes="48px"
        className="object-cover object-[50%_35%] scale-110"
      />
    </div>
  )
}
