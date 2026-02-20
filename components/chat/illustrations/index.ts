import type { PersonaId } from '@/types/chat'
import { DoctorIllustration } from './doctor-illustration'
import { CriticIllustration } from './critic-illustration'
import { GuideIllustration } from './guide-illustration'

export { DoctorIllustration, CriticIllustration, GuideIllustration }

/** Shared map of persona ID to illustration component. */
export const PERSONA_ILLUSTRATIONS: Record<
  PersonaId,
  React.ComponentType<{ className?: string }>
> = {
  doctor: DoctorIllustration,
  critic: CriticIllustration,
  guide: GuideIllustration,
}
