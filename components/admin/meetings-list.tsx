import { getTranslations } from 'next-intl/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getUpcomingBookings,
  getPastBookings,
} from '@/lib/booking/admin-queries'
import { MeetingCard } from './meeting-card'

export async function MeetingsList() {
  const t = await getTranslations('adminDashboard')
  const [upcoming, past] = await Promise.all([
    getUpcomingBookings(),
    getPastBookings(),
  ])

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming">
          {t('upcoming')} ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          {t('past')} ({past.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4 space-y-4">
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noUpcoming')}
          </p>
        ) : (
          upcoming.map((booking) => (
            <MeetingCard key={booking.id} booking={booking} />
          ))
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4 space-y-4">
        {past.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noPast')}
          </p>
        ) : (
          past.map((booking) => (
            <MeetingCard key={booking.id} booking={booking} />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}
