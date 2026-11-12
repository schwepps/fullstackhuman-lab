import type { Metadata } from 'next'
import { PUBLIC_URL } from '@/lib/constants'
import { getAllLevelsPublicInfo } from '@/lib/levels'
import { HomeContent } from '@/components/home-content'

export const metadata: Metadata = {
  alternates: { canonical: PUBLIC_URL },
}

const levels = getAllLevelsPublicInfo()

export default function HomePage() {
  return <HomeContent levels={levels} />
}
