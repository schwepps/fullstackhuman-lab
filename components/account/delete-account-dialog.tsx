'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { deleteAccountAction } from '@/lib/auth/account-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountErrorAlert } from '@/components/account/account-error-alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DeleteAccountDialog() {
  const t = useTranslations('account')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    null
  )

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-destructive">
        {t('deleteAccount.title')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('deleteAccount.description')}
      </p>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="h-12 touch-manipulation sm:h-10"
          >
            {t('deleteAccount.submit')}
          </Button>
        </DialogTrigger>
        <DialogContent closeLabel={t('deleteAccount.closeLabel')}>
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>{t('deleteAccount.confirmTitle')}</DialogTitle>
              <DialogDescription>
                {t('deleteAccount.confirmDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-2">
              <AccountErrorAlert error={state?.error} />
              <Label htmlFor="delete-password">
                {t('deleteAccount.passwordLabel')}
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('deleteAccount.passwordPlaceholder')}
                required
                className="h-12 text-base sm:h-10 sm:text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                className="h-12 touch-manipulation sm:h-10"
              >
                {t('deleteAccount.cancel')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending}
                className="h-12 touch-manipulation sm:h-10"
              >
                {isPending
                  ? t('deleteAccount.confirming')
                  : t('deleteAccount.confirmSubmit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
