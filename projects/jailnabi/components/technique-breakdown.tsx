'use client'

interface TechniqueBreakdownProps {
  skillBreakdown: string
}

export function TechniqueBreakdown({
  skillBreakdown,
}: TechniqueBreakdownProps) {
  return (
    <div
      className="card border-primary bg-primary-muted p-4"
      role="region"
      aria-label="AI Skill lesson"
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        AI Skill Lesson
      </h3>
      <p className="text-sm leading-relaxed text-foreground">
        {skillBreakdown}
      </p>
    </div>
  )
}
