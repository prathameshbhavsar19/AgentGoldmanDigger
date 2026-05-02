import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore, STEP_ORDER } from '../onboardingStore'

beforeEach(() => { useOnboardingStore.getState().reset() })

describe('onboardingStore', () => {
  it('starts at details step', () => {
    expect(useOnboardingStore.getState().currentStep).toBe('details')
  })

  it('nextStep advances to next step', () => {
    useOnboardingStore.getState().nextStep()
    expect(useOnboardingStore.getState().currentStep).toBe('goal')
  })

  it('prevStep goes back', () => {
    useOnboardingStore.getState().setStep('goal')
    useOnboardingStore.getState().prevStep()
    expect(useOnboardingStore.getState().currentStep).toBe('details')
  })

  it('prevStep does nothing at first step', () => {
    useOnboardingStore.getState().prevStep()
    expect(useOnboardingStore.getState().currentStep).toBe('details')
  })

  it('nextStep does nothing at last step', () => {
    useOnboardingStore.getState().setStep('review')
    useOnboardingStore.getState().nextStep()
    expect(useOnboardingStore.getState().currentStep).toBe('review')
  })

  it('patch updates fields', () => {
    useOnboardingStore.getState().patch({ firstName: 'Priya', goal: 'wealth-creation' })
    const s = useOnboardingStore.getState()
    expect(s.firstName).toBe('Priya')
    expect(s.goal).toBe('wealth-creation')
  })

  it('computeTone returns analytical for rebalance-compare familiarity', () => {
    useOnboardingStore.getState().patch({ familiarity: 'rebalance-compare' })
    expect(useOnboardingStore.getState().tone).toBe('analytical')
  })

  it('computeTone returns explanatory for choose-some familiarity', () => {
    useOnboardingStore.getState().patch({ familiarity: 'choose-some' })
    expect(useOnboardingStore.getState().tone).toBe('explanatory')
  })

  it('computeTone returns encouraging by default', () => {
    useOnboardingStore.getState().patch({ familiarity: 'never-invested' })
    expect(useOnboardingStore.getState().tone).toBe('encouraging')
  })

  it('setPortfolioFile stores file info', () => {
    useOnboardingStore.getState().setPortfolioFile('file-001', 'portfolio.csv')
    const s = useOnboardingStore.getState()
    expect(s.portfolioFileId).toBe('file-001')
    expect(s.portfolioFileName).toBe('portfolio.csv')
  })

  it('reset clears all state', () => {
    useOnboardingStore.getState().patch({ firstName: 'Test' })
    useOnboardingStore.getState().reset()
    expect(useOnboardingStore.getState().firstName).toBe('')
  })

  it('step order is correct length', () => {
    expect(STEP_ORDER).toHaveLength(11)
  })
})
