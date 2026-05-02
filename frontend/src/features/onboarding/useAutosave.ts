import { useCallback } from 'react'
import { useOnboardingStore, STEP_ORDER } from '../../stores/onboardingStore'
import { saveSessionStep } from '../../lib/api'

export function useAutosave() {
  const { sessionId, currentStep } = useOnboardingStore()

  const save = useCallback(
    async (data: Record<string, unknown>) => {
      if (!sessionId) return
      // Include the next step name so the backend can resume correctly on page reload
      const currentIdx = STEP_ORDER.indexOf(currentStep)
      const nextStep = STEP_ORDER[currentIdx + 1] ?? currentStep
      try {
        await saveSessionStep(sessionId, { ...data, currentStep: nextStep })
      } catch {
        // Non-blocking — local zustand state is source of truth
      }
    },
    [sessionId, currentStep]
  )

  return save
}
