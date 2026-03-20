import { notFound } from 'next/navigation'
import { getChallenge, getChallengesByCourseName } from '@/lib/challenges'
import { PlayClient } from './play-client'

interface PageProps {
  params: Promise<{ challengeId: string }>
}

export default async function PlayPage({ params }: PageProps) {
  const { challengeId } = await params
  const challenge = getChallenge(challengeId)

  if (!challenge) notFound()

  // Determine the next challenge in the same course
  const courseChallenges = getChallengesByCourseName(challenge.course)
  const currentIndex = courseChallenges.findIndex((c) => c.id === challenge.id)
  const nextChallenge = courseChallenges[currentIndex + 1] ?? null

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
        totalHoles: courseChallenges.length,
        nextChallengeId: nextChallenge?.id ?? null,
        hints: challenge.hints,
      }}
    />
  )
}
