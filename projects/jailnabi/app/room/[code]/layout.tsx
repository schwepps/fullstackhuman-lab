import type { Metadata } from 'next'
import { getRoom } from '@/lib/room-manager'
import { getSiteUrl, BASE_PATH } from '@/lib/constants'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ code: string }>
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { code } = await params
  const room = await getRoom(code.toUpperCase())

  if (!room) {
    return { title: 'Room Not Found — Jailnabi' }
  }

  const title = `"${room.crime}" — Join Jailnabi Room ${room.code}`
  const description = `${room.creatorName} accuses: "${room.initialAccusation.slice(0, 100)}${room.initialAccusation.length > 100 ? '...' : ''}" — Join and defend yourself!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`${getSiteUrl()}${BASE_PATH}/api/og?room=${room.code}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${getSiteUrl()}${BASE_PATH}/api/og?room=${room.code}`],
    },
  }
}

export default function RoomLayout({ children }: LayoutProps) {
  return <>{children}</>
}
