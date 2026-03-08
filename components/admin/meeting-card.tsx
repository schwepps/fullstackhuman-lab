import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MessageSquare, User } from 'lucide-react'
import type { BookingWithMeetingType } from '@/lib/booking/types'

interface MeetingCardProps {
  booking: BookingWithMeetingType
}

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show: 'outline',
}

export async function MeetingCard({ booking }: MeetingCardProps) {
  const t = await getTranslations('adminDashboard')
  const startsAt = new Date(booking.starts_at)
  const date = startsAt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const time = startsAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card className="terminal-border border-primary/10">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {booking.booker_name}
            </span>
            <Badge variant={STATUS_VARIANTS[booking.status] ?? 'outline'}>
              {t(`status.${booking.status}`)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {time} ({booking.timezone})
            </span>
            <span className="font-mono text-xs">
              {booking.meeting_type.duration_minutes}min
            </span>
            {booking.conversation_id && (
              <span className="flex items-center gap-1 text-primary">
                <MessageSquare className="size-3.5" />
                {t('hasContext')}
              </span>
            )}
          </div>
          {booking.booker_message && (
            <p className="text-sm text-muted-foreground italic">
              &ldquo;{booking.booker_message}&rdquo;
            </p>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {booking.booker_email}
        </div>
      </CardContent>
    </Card>
  )
}
