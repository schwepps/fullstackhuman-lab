'use client'

import { useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { MarkdownRenderer } from '@/components/chat/markdown-renderer'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { CalendlyCta } from '@/components/shared/calendly-cta'
import { ShareButton } from '@/components/report/share-button'
import { buildReportShareUrl } from '@/lib/constants/reports'
import type { PersonaId } from '@/types/chat'

interface ReportCardProps {
  content: string
  persona: PersonaId
  shareToken: string | null
}

export function ReportCard({ content, persona, shareToken }: ReportCardProps) {
  const t = useTranslations('chat.report')
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const { trackReportCopied } = useAnalytics()
  const Illustration = PERSONA_ILLUSTRATIONS[persona]

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      trackReportCopied({ persona })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (HTTP, iframe, or permission denied)
    }
  }, [content, persona, trackReportCopied])

  return (
    <Card className="terminal-border my-2 border-primary/30 bg-card/50">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2 text-sm text-primary">
          <Illustration className="size-5 text-primary" />
          <span className="font-mono uppercase tracking-wider">
            {t('label')}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <MarkdownRenderer content={content} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="touch-manipulation"
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              {t('copied')}
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              {t('copy')}
            </>
          )}
        </Button>
        {shareToken && (
          <ShareButton
            shareUrl={buildReportShareUrl(shareToken, locale)}
            persona={persona}
          />
        )}
        <CalendlyCta variant="inline" source="report_card" />
      </CardFooter>
    </Card>
  )
}
