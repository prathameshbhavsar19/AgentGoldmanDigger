import { useCallback } from 'react'
import { useOnboardingStore } from '../../stores/onboardingStore'
import { saveSessionStep } from '../../lib/api'

export function useAutosave() {
  const { sessionId } = useOnboardingStore()

  const save = useCallback(
    async (data: Record<string, unknown>) => {
      if (!sessionId) return
      try {
        await saveSessionStep(sessionId, data)
      } catch {
        // Non-blocking — local state is source of truth for the demo
      }
    },
    [sessionId]
  )

  return save
}
