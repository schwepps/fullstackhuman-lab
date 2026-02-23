'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface DownloadPdfButtonProps {
  shareToken: string
}

export function DownloadPdfButton({ shareToken }: DownloadPdfButtonProps) {
  const t = useTranslations('reportTemplate')

  return (
    <Button asChild variant="outline" size="sm" className="touch-manipulation">
      <a href={`/api/report/${shareToken}/pdf`} download>
        <Download className="size-3.5" />
        {t('downloadPdf')}
      </a>
    </Button>
  )
}
