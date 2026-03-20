'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AISkill } from '@/lib/techniques'

interface OnboardingProps {
  currentSkill: AISkill | null
  onComplete: () => void
}

const STEPS = [
  {
    title: 'Welcome to Jailnabi',
    description:
      'A daily game where you craft AI prompts to generate fake evidence against your colleagues.',
  },
  {
    title: 'How It Works',
    description:
      'Each day: a crime is announced \u2192 you write a short prompt (max 25 words) \u2192 AI generates fake evidence \u2192 the judge picks the most convincing \u2192 someone goes to jail!',
  },
]

export function Onboarding({ currentSkill, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)

  const totalSteps = currentSkill ? STEPS.length + 1 : STEPS.length
  const isLastStep = step === totalSteps - 1

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete()
    } else {
      setStep((s) => s + 1)
    }
  }, [isLastStep, onComplete])

  // Focus trap + Escape handler
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // Focus first button on mount
    const firstButton = dialog.querySelector<HTMLButtonElement>('button')
    firstButton?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onComplete()
        return
      }

      // Trap focus within dialog
      if (e.key === 'Tab') {
        const focusable = dialog!.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onComplete])

  const isSkillStep = step === STEPS.length && currentSkill
  const currentStepData = !isSkillStep ? STEPS[step] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="card w-full max-w-md p-6 text-center"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome walkthrough"
      >
        {/* Step indicator */}
        <div className="mb-6 flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {isSkillStep ? (
          <>
            <h2 className="mb-3 text-xl font-bold text-primary">
              Today&apos;s AI Skill
            </h2>
            <div className="mb-4 rounded-lg bg-primary-muted p-4">
              <p className="mb-1 text-lg font-bold text-primary">
                {currentSkill.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentSkill.tip}
              </p>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Use this skill in your prompt for bonus points!
              <br />
              <span className="italic text-foreground">
                Example: {currentSkill.example}
              </span>
            </p>
          </>
        ) : currentStepData ? (
          <>
            <h2 className="mb-3 text-xl font-bold text-primary">
              {currentStepData.title}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {currentStepData.description}
            </p>
          </>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onComplete}
            className="btn btn-secondary flex-1"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary flex-1"
          >
            {isLastStep ? "Let's Go" : 'Next'}
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Step {step + 1} of {totalSteps}
        </p>
      </div>
    </div>
  )
}
