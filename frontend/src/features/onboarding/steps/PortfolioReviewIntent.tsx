import { useState } from 'react'
import { useOnboardingStore } from '../../../stores/onboardingStore'
import { useAutosave } from '../useAutosave'
import StepShell from '../StepShell'
import OptionCard from '../../../components/ui/OptionCard'

const OPTIONS = [
  { value: 'understand',        label: 'Understand what I own',                    desc: '' },
  { value: 'check-goal-match',  label: 'Check if my portfolio matches my goal',    desc: '' },
  { value: 'reduce-risk',       label: 'Reduce risk',                              desc: '' },
  { value: 'diversify',         label: 'Improve diversification',                  desc: '' },
  { value: 'find-overlap',      label: 'Find overlapping funds or repeated exposure', desc: '' },
  { value: 'rebalance',         label: 'Rebalance based on market uncertainty',    desc: '' },
  { value: 'compare-strategies', label: 'Compare strategy options',                desc: '' },
  { value: 'simplify',          label: 'Simplify my portfolio',                    desc: '' },
]

export default function PortfolioReviewIntentStep() {
  const store = useOnboardingStore()
  const save = useAutosave()
  const [intent, setIntent] = useState(store.portfolioReviewIntent)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!intent) { setError('Please select what you want help with.'); return }
    store.patch({ portfolioReviewIntent: intent })
    await save({ portfolioReviewIntent: intent })
    store.nextStep()
  }

  return (
    <StepShell title="What do you want Portfolio GPS to help you with?" subtitle="This shapes your strategy canvas layout." onSubmit={handleSubmit}>
      <div role="radiogroup" aria-label="Portfolio review intent" className="flex flex-col gap-2">
        {OPTIONS.map(o => (
          <OptionCard key={o.value} value={o.value} label={o.label} selected={intent === o.value} onClick={() => { setIntent(o.value); setError('') }} />
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </StepShell>
  )
}
