'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import type { PersonaId } from '@/types/chat'

interface ShareButtonProps {
  shareUrl: string
  persona: PersonaId
}

export function ShareButton({ shareUrl, persona }: ShareButtonProps) {
  const t = useTranslations('report')
  const [copied, setCopied] = useState(false)
  const { trackReportLinkCopied } = useAnalytics()

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      trackReportLinkCopied({ persona })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (HTTP, iframe, or permission denied)
    }
  }, [shareUrl, persona, trackReportLinkCopied])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="touch-manipulation"
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          {t('linkCopied')}
        </>
      ) : (
        <>
          <Share2 className="size-3.5" />
          {t('shareLink')}
        </>
      )}
    </Button>
  )
}
