import { notFound } from 'next/navigation'
import { getLevelPublicInfo } from '@/lib/levels'
import { PlayClient } from './play-client'

export default async function PlayPage({
  params,
}: {
  params: Promise<{ levelId: string }>
}) {
  const { levelId: levelIdStr } = await params
  const levelId = parseInt(levelIdStr, 10)

  const level = getLevelPublicInfo(levelId)
  if (!level) notFound()

  return <PlayClient level={level} />
}
