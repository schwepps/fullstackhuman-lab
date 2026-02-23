'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { deleteConversation } from '@/lib/conversations/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteConversationDialogProps {
  conversationId: string
  hasReport: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteConversationDialog({
  conversationId,
  hasReport,
  open,
  onOpenChange,
  onDeleted,
}: DeleteConversationDialogProps) {
  const t = useTranslations('conversations')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setError(null)
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  async function handleDelete() {
    setIsPending(true)
    setError(null)

    const result = await deleteConversation(conversationId)

    if (result.success) {
      onOpenChange(false)
      onDeleted()
    } else {
      setError(t('deleteError'))
    }

    setIsPending(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent closeLabel={t('deleteCancel')}>
        <DialogHeader>
          <DialogTitle>{t('deleteConfirm')}</DialogTitle>
          <DialogDescription>{t('deleteDescription')}</DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {hasReport && (
            <p className="text-sm font-medium text-warning">
              {t('deleteSharedWarning')}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="h-12 touch-manipulation sm:h-10"
          >
            {t('deleteCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="h-12 touch-manipulation sm:h-10"
          >
            {isPending ? t('deleting') : t('deleteSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
