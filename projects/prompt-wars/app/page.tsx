import { getAllLevelsPublicInfo } from '@/lib/levels'
import { HomeContent } from '@/components/home-content'

const levels = getAllLevelsPublicInfo()

export default function HomePage() {
  return <HomeContent levels={levels} />
}
