'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useAuth } from '@/lib/hooks/use-auth'
import { logoutAction } from '@/lib/auth/actions'
import { getDisplayName, asString } from '@/lib/auth/display-name'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Settings } from 'lucide-react'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu() {
  const t = useTranslations('userMenu')
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />
  }

  if (!isAuthenticated) {
    return (
      <Button variant="ghost" size="sm" asChild className="font-mono text-xs">
        <Link href="/auth/login">{t('login')}</Link>
      </Button>
    )
  }

  const displayName = getDisplayName(user)
  const rawAvatarUrl = asString(user?.user_metadata?.avatar_url)
  const avatarUrl = rawAvatarUrl?.startsWith('https://')
    ? rawAvatarUrl
    : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-8 cursor-pointer rounded-full"
        >
          <Avatar className="size-8">
            <AvatarImage src={avatarUrl} alt={displayName ?? ''} />
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/account">
            <Settings className="mr-2 size-4" />
            {t('account')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={async () => {
            await logoutAction()
          }}
        >
          <LogOut className="mr-2 size-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
