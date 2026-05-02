import type { ReactNode } from 'react'
import { useOnboardingStore } from '../../stores/onboardingStore'
import Button from '../../components/ui/Button'
import { ArrowLeft } from 'lucide-react'

interface StepShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  onSubmit?: () => void
  submitting?: boolean
  ctaLabel?: string
  hideback?: boolean
  hideSubmit?: boolean
}

export function StepShell({ title, subtitle, children, onSubmit, submitting, ctaLabel = 'Continue', hideback, hideSubmit }: StepShellProps) {
  const { prevStep, currentStep } = useOnboardingStore()
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.() }}
      className="flex flex-col gap-6"
      noValidate
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2">{title}</h2>
        {subtitle && <p className="text-ink-muted">{subtitle}</p>}
      </div>
      {children}
      {!hideSubmit && (
        <div className="flex items-center gap-3 pt-2">
          {!hideback && currentStep !== 'details' && (
            <Button type="button" variant="ghost" size="md" onClick={prevStep} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Button type="submit" size="lg" fullWidth loading={submitting} className="flex-1">
            {ctaLabel}
          </Button>
        </div>
      )}
    </form>
  )
}
export default StepShell
