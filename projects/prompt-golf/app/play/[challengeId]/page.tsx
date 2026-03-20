import { notFound } from 'next/navigation'
import { getChallenge } from '@/lib/challenges'
import { PlayClient } from './play-client'

interface PageProps {
  params: Promise<{ challengeId: string }>
}

export default async function PlayPage({ params }: PageProps) {
  const { challengeId } = await params
  const challenge = getChallenge(challengeId)

  if (!challenge) notFound()

  return (
    <PlayClient
      challenge={{
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        par: challenge.par,
        principle: challenge.principle,
        course: challenge.course,
        holeNumber: challenge.holeNumber,
        hints: challenge.hints,
      }}
    />
  )
}
