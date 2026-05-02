import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useOnboardingStore, STEP_ORDER, type OnboardingStep } from '../../stores/onboardingStore'
import { createSession } from '../../lib/api'
import { copy } from '../../lib/copy'
import Stepper from '../../components/ui/Stepper'

// Step components
import CustomerDetails from './steps/CustomerDetails'
import InvestmentGoal from './steps/InvestmentGoal'
import TimeHorizon from './steps/TimeHorizon'
import MonthlyCapacity from './steps/MonthlyCapacity'
import EmergencySavings from './steps/EmergencySavings'
import RiskReaction from './steps/RiskReaction'
import InvestmentFamiliarity from './steps/InvestmentFamiliarity'
import InvestmentStatus from './steps/InvestmentStatus'
import PortfolioInputMethod from './steps/PortfolioInputMethod'
import PortfolioReviewIntent from './steps/PortfolioReviewIntent'
import ReviewAndConsent from './steps/ReviewAndConsent'

const STEP_LABELS = copy.onboarding.stepLabels

const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
  'details':           CustomerDetails,
  'goal':              InvestmentGoal,
  'timeline':          TimeHorizon,
  'capacity':          MonthlyCapacity,
  'savings':           EmergencySavings,
  'risk':              RiskReaction,
  'familiarity':       InvestmentFamiliarity,
  'status':            InvestmentStatus,
  'portfolio-method':  PortfolioInputMethod,
  'portfolio-intent':  PortfolioReviewIntent,
  'review':            ReviewAndConsent,
}

// Visible steps for the stepper (profile/goal/…/review) — skip portfolio-method and intent from stepper labels
const VISIBLE_STEPS: OnboardingStep[] = ['details','goal','timeline','capacity','savings','risk','familiarity','status','review']

export default function OnboardingShell() {
  const [searchParams] = useSearchParams()
  const { sessionId, currentStep, setSessionId, setStep } = useOnboardingStore()

  const { mutate: initSession } = useMutation({
    mutationFn: createSession,
    onSuccess: (data) => setSessionId(data.sessionId),
  })

  useEffect(() => {
    if (!sessionId) initSession()
  }, [sessionId, initSession])

  useEffect(() => {
    const step = searchParams.get('step') as OnboardingStep | null
    if (step && STEP_ORDER.includes(step)) setStep(step)
  }, [searchParams, setStep])

  const StepComponent = STEP_COMPONENTS[currentStep]
  const visibleIdx = VISIBLE_STEPS.indexOf(currentStep as OnboardingStep)
  const stepperIdx = visibleIdx >= 0 ? visibleIdx : 0

  return (
    <div className="min-h-screen bg-surface">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-bg-elev/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <Stepper steps={STEP_LABELS} currentIndex={stepperIdx} />
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <StepComponent />
      </div>
    </div>
  )
}
