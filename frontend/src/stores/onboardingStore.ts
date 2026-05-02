import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OnboardingStep =
  | 'details'
  | 'goal'
  | 'timeline'
  | 'capacity'
  | 'savings'
  | 'risk'
  | 'familiarity'
  | 'status'
  | 'portfolio-method'
  | 'portfolio-intent'
  | 'review'

export const STEP_ORDER: OnboardingStep[] = [
  'details',
  'goal',
  'timeline',
  'capacity',
  'savings',
  'risk',
  'familiarity',
  'status',
  'portfolio-method',
  'portfolio-intent',
  'review',
]

export interface OnboardingData {
  sessionId: string | null
  currentStep: OnboardingStep
  // Customer details
  firstName: string
  lastName: string
  email: string
  country: string
  ageRange: string
  employmentStatus: string
  incomeRange: string
  currency: string
  primaryConcern: string
  // Onboarding answers
  goal: string
  horizon: string
  capacity: string
  savings: string
  riskReaction: string
  familiarity: string
  investmentStatus: string
  portfolioMethod: string
  portfolioReviewIntent: string
  // Portfolio file
  portfolioFileId: string | null
  portfolioFileName: string | null
  // Silent tone (never displayed)
  tone: 'encouraging' | 'explanatory' | 'analytical'
  consentGiven: boolean
}

type OnboardingStore = OnboardingData & {
  setSessionId: (id: string) => void
  setStep: (step: OnboardingStep) => void
  nextStep: () => void
  prevStep: () => void
  patch: (data: Partial<OnboardingData>) => void
  setPortfolioFile: (fileId: string, fileName: string) => void
  computeTone: () => 'encouraging' | 'explanatory' | 'analytical'
  reset: () => void
}

const DEFAULTS: OnboardingData = {
  sessionId: null,
  currentStep: 'details',
  firstName: '', lastName: '', email: '', country: '', ageRange: '',
  employmentStatus: '', incomeRange: '', currency: 'USD', primaryConcern: '',
  goal: '', horizon: '', capacity: '', savings: '', riskReaction: '',
  familiarity: '', investmentStatus: '', portfolioMethod: '', portfolioReviewIntent: '',
  portfolioFileId: null, portfolioFileName: null,
  tone: 'encouraging',
  consentGiven: false,
}

function computeToneFromData(data: Partial<OnboardingData>): 'encouraging' | 'explanatory' | 'analytical' {
  const fam = data.familiarity ?? ''
  if (fam === 'rebalance-compare') return 'analytical'
  if (fam === 'track-review' || fam === 'choose-some') return 'explanatory'
  return 'encouraging'
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setSessionId: (id) => set({ sessionId: id }),
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const { currentStep } = get()
        const idx = STEP_ORDER.indexOf(currentStep)
        if (idx < STEP_ORDER.length - 1) set({ currentStep: STEP_ORDER[idx + 1] })
      },
      prevStep: () => {
        const { currentStep } = get()
        const idx = STEP_ORDER.indexOf(currentStep)
        if (idx > 0) set({ currentStep: STEP_ORDER[idx - 1] })
      },
      patch: (data) => {
        set({ ...data, tone: computeToneFromData({ ...get(), ...data }) })
      },
      setPortfolioFile: (fileId, fileName) =>
        set({ portfolioFileId: fileId, portfolioFileName: fileName }),
      computeTone: () => computeToneFromData(get()),
      reset: () => set(DEFAULTS),
    }),
    { name: 'pgps-onboarding' }
  )
)
